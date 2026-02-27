use erp_proto::school::student_service_server::StudentService;
use erp_proto::school::staff_service_server::StaffService;
use erp_proto::school::number_service_server::NumberService;
use erp_proto::school::*;
use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

// ─────────────────────────────────────────────────────────────
// School Service (implements both StudentService + StaffService)
// ─────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct SchoolService {
    pub pool: PgPool,
}

impl SchoolService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Set RLS tenant context for the connection
    async fn set_tenant(&self, tenant_id: &str) -> Result<sqlx::pool::PoolConnection<sqlx::Postgres>, Status> {
        let mut conn = self.pool.acquire().await
            .map_err(|e| Status::internal(format!("Pool error: {e}")))?;
        sqlx::query(&format!("SET LOCAL app.current_tenant = '{}'", tenant_id))
            .execute(&mut *conn)
            .await
            .map_err(|e| Status::internal(format!("RLS set error: {e}")))?;
        Ok(conn)
    }
}

// ─────────────────────────────────────────────────────────────
// StudentService Implementation
// ─────────────────────────────────────────────────────────────

#[tonic::async_trait]
impl StudentService for SchoolService {
    async fn admit_student(
        &self,
        request: Request<AdmitStudentRequest>,
    ) -> Result<Response<StudentResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;
        let student_id = Uuid::new_v4();
        let now = chrono::Utc::now();

        let class_teacher_id: Option<Uuid> = if req.class_teacher_id.is_empty() {
            None
        } else {
            Some(Uuid::parse_str(&req.class_teacher_id)
                .map_err(|_| Status::invalid_argument("Invalid class_teacher_id"))?)
        };

        let section = if req.section.is_empty() { "A".to_string() } else { req.section.clone() };

        let user_id: Option<Uuid> = if req.user_id.is_empty() {
            None
        } else {
            Some(Uuid::parse_str(&req.user_id)
                .map_err(|_| Status::invalid_argument("Invalid user_id"))?)
        };

        sqlx::query(
            r#"INSERT INTO students
               (id, tenant_id, user_id, admission_number, first_name, last_name,
                class_grade, section, parent_email, class_teacher_id, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)"#,
        )
        .bind(student_id)
        .bind(tenant_id)
        .bind(user_id)
        .bind(&req.admission_number)
        .bind(&req.first_name)
        .bind(&req.last_name)
        .bind(req.class_grade)
        .bind(&section)
        .bind(&req.parent_email)
        .bind(class_teacher_id)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Insert student error: {e}")))?;

        // Advance the number sequence past this admission number so next call returns the next one
        let current_year: i32 = chrono::Utc::now().format("%y").to_string().parse().unwrap_or(25);
        let _ = sqlx::query(
            r#"UPDATE number_sequences
               SET next_sequence = next_sequence + 1
               WHERE tenant_id = $1 AND type = 'student' AND year = $2"#,
        )
        .bind(tenant_id)
        .bind(current_year)
        .execute(&self.pool)
        .await;

        Ok(Response::new(StudentResponse {
            success: true,
            message: "Student admitted successfully".into(),
            student: Some(Student {
                id: student_id.to_string(),
                admission_number: req.admission_number,
                first_name: req.first_name,
                last_name: req.last_name,
                class_grade: req.class_grade,
                section,
                parent_email: req.parent_email,
                class_teacher_id: class_teacher_id.map(|u| u.to_string()).unwrap_or_default(),
                is_active: true,
                created_at: now.to_rfc3339(),
                user_id: req.user_id,
            }),
        }))
    }

    async fn get_student(
        &self,
        request: Request<GetStudentRequest>,
    ) -> Result<Response<StudentResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;
        let student_id = Uuid::parse_str(&req.student_id)
            .map_err(|_| Status::invalid_argument("Invalid student_id"))?;

        let row = sqlx::query_as::<_, (Uuid, String, String, String, i32, String, Option<String>, Option<Uuid>, bool, chrono::DateTime<chrono::Utc>, Option<Uuid>)>(
            r#"SELECT id, admission_number, first_name, last_name, class_grade,
                      section, parent_email, class_teacher_id, is_active, created_at, user_id
               FROM students WHERE id = $1 AND tenant_id = $2"#,
        )
        .bind(student_id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Query error: {e}")))?;

        match row {
            Some(r) => Ok(Response::new(StudentResponse {
                success: true,
                message: "Student found".into(),
                student: Some(Student {
                    id: r.0.to_string(),
                    admission_number: r.1,
                    first_name: r.2,
                    last_name: r.3,
                    class_grade: r.4,
                    section: r.5,
                    parent_email: r.6.unwrap_or_default(),
                    class_teacher_id: r.7.map(|u| u.to_string()).unwrap_or_default(),
                    is_active: r.8,
                    created_at: r.9.to_rfc3339(),
                    user_id: r.10.map(|u| u.to_string()).unwrap_or_default(),
                }),
            })),
            None => Err(Status::not_found("Student not found")),
        }
    }

    async fn list_students(
        &self,
        request: Request<ListStudentsRequest>,
    ) -> Result<Response<ListStudentsResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let mut query = String::from(
            "SELECT id, admission_number, first_name, last_name, class_grade, \
             section, parent_email, class_teacher_id, is_active, created_at, user_id \
             FROM students WHERE tenant_id = $1"
        );
        if req.class_grade > 0 {
            query.push_str(&format!(" AND class_grade = {}", req.class_grade));
        }
        if !req.section.is_empty() {
            query.push_str(&format!(" AND section = '{}'", req.section));
        }
        query.push_str(" ORDER BY class_grade, section, last_name");

        let rows = sqlx::query_as::<_, (Uuid, String, String, String, i32, String, Option<String>, Option<Uuid>, bool, chrono::DateTime<chrono::Utc>, Option<Uuid>)>(&query)
            .bind(tenant_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Query error: {e}")))?;

        let students: Vec<Student> = rows
            .into_iter()
            .map(|r| Student {
                id: r.0.to_string(),
                admission_number: r.1,
                first_name: r.2,
                last_name: r.3,
                class_grade: r.4,
                section: r.5,
                parent_email: r.6.unwrap_or_default(),
                class_teacher_id: r.7.map(|u| u.to_string()).unwrap_or_default(),
                is_active: r.8,
                created_at: r.9.to_rfc3339(),
                user_id: r.10.map(|u| u.to_string()).unwrap_or_default(),
            })
            .collect();

        Ok(Response::new(ListStudentsResponse { students }))
    }

    async fn update_student(
        &self,
        request: Request<UpdateStudentRequest>,
    ) -> Result<Response<StudentResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;
        let student_id = Uuid::parse_str(&req.student_id)
            .map_err(|_| Status::invalid_argument("Invalid student_id"))?;

        let class_teacher_id: Option<Uuid> = if req.class_teacher_id.is_empty() {
            None
        } else {
            Some(Uuid::parse_str(&req.class_teacher_id)
                .map_err(|_| Status::invalid_argument("Invalid class_teacher_id"))?)
        };

        let section = if req.section.is_empty() { "A".to_string() } else { req.section.clone() };

        let result = sqlx::query(
            r#"UPDATE students
               SET first_name = $1, last_name = $2, class_grade = $3,
                   section = $4, parent_email = $5, class_teacher_id = $6, is_active = $7
               WHERE id = $8 AND tenant_id = $9"#,
        )
        .bind(&req.first_name)
        .bind(&req.last_name)
        .bind(req.class_grade)
        .bind(&section)
        .bind(&req.parent_email)
        .bind(class_teacher_id)
        .bind(req.is_active)
        .bind(student_id)
        .bind(tenant_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Update student error: {e}")))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("Student not found"));
        }

        // Fetch updated student
        let row = sqlx::query_as::<_, (Uuid, String, String, String, i32, String, Option<String>, Option<Uuid>, bool, chrono::DateTime<chrono::Utc>, Option<Uuid>)>(
            r#"SELECT id, admission_number, first_name, last_name, class_grade,
                      section, parent_email, class_teacher_id, is_active, created_at, user_id
               FROM students WHERE id = $1 AND tenant_id = $2"#,
        )
        .bind(student_id)
        .bind(tenant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Query error: {e}")))?;

        Ok(Response::new(StudentResponse {
            success: true,
            message: "Student updated successfully".into(),
            student: Some(Student {
                id: row.0.to_string(),
                admission_number: row.1,
                first_name: row.2,
                last_name: row.3,
                class_grade: row.4,
                section: row.5,
                parent_email: row.6.unwrap_or_default(),
                class_teacher_id: row.7.map(|u| u.to_string()).unwrap_or_default(),
                is_active: row.8,
                created_at: row.9.to_rfc3339(),
                user_id: row.10.map(|u| u.to_string()).unwrap_or_default(),
            }),
        }))
    }

    async fn delete_student(
        &self,
        request: Request<DeleteStudentRequest>,
    ) -> Result<Response<StudentResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;
        let student_id = Uuid::parse_str(&req.student_id)
            .map_err(|_| Status::invalid_argument("Invalid student_id"))?;

        // Fetch student before deleting for the response
        let row = sqlx::query_as::<_, (Uuid, String, String, String, i32, String, Option<String>, Option<Uuid>, bool, chrono::DateTime<chrono::Utc>, Option<Uuid>)>(
            r#"SELECT id, admission_number, first_name, last_name, class_grade,
                      section, parent_email, class_teacher_id, is_active, created_at, user_id
               FROM students WHERE id = $1 AND tenant_id = $2"#,
        )
        .bind(student_id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Query error: {e}")))?;

        let student_row = row.ok_or_else(|| Status::not_found("Student not found"))?;

        let result = sqlx::query(
            "DELETE FROM students WHERE id = $1 AND tenant_id = $2"
        )
        .bind(student_id)
        .bind(tenant_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Delete student error: {e}")))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("Student not found"));
        }

        Ok(Response::new(StudentResponse {
            success: true,
            message: "Student deleted successfully".into(),
            student: Some(Student {
                id: student_row.0.to_string(),
                admission_number: student_row.1,
                first_name: student_row.2,
                last_name: student_row.3,
                class_grade: student_row.4,
                section: student_row.5,
                parent_email: student_row.6.unwrap_or_default(),
                class_teacher_id: student_row.7.map(|u| u.to_string()).unwrap_or_default(),
                is_active: student_row.8,
                created_at: student_row.9.to_rfc3339(),
                user_id: student_row.10.map(|u| u.to_string()).unwrap_or_default(),
            }),
        }))
    }
}

// ─────────────────────────────────────────────────────────────
// StaffService Implementation
// ─────────────────────────────────────────────────────────────

#[tonic::async_trait]
impl StaffService for SchoolService {
    async fn onboard_staff(
        &self,
        request: Request<OnboardStaffRequest>,
    ) -> Result<Response<StaffResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;
        let user_id = Uuid::parse_str(&req.user_id)
            .map_err(|_| Status::invalid_argument("Invalid user_id"))?;
        let staff_id = Uuid::new_v4();
        let now = chrono::Utc::now();

        // Fetch user full_name for the response
        let full_name: String = sqlx::query_scalar("SELECT full_name FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("User query error: {e}")))?
            .flatten()
            .unwrap_or_default();

        sqlx::query(
            r#"INSERT INTO staff
               (id, tenant_id, user_id, employee_number, designation, department, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, true, $7)"#,
        )
        .bind(staff_id)
        .bind(tenant_id)
        .bind(user_id)
        .bind(&req.employee_number)
        .bind(&req.designation)
        .bind(&req.department)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Insert staff error: {e}")))?;

        // Advance the number sequence past this employee number so next call returns the next one
        let current_year: i32 = chrono::Utc::now().format("%y").to_string().parse().unwrap_or(25);
        let _ = sqlx::query(
            r#"UPDATE number_sequences
               SET next_sequence = next_sequence + 1
               WHERE tenant_id = $1 AND type = 'staff' AND year = $2"#,
        )
        .bind(tenant_id)
        .bind(current_year)
        .execute(&self.pool)
        .await;

        Ok(Response::new(StaffResponse {
            success: true,
            message: "Staff onboarded successfully".into(),
            staff: Some(StaffMember {
                id: staff_id.to_string(),
                user_id: user_id.to_string(),
                employee_number: req.employee_number,
                designation: req.designation,
                department: req.department,
                full_name,
                is_active: true,
                created_at: now.to_rfc3339(),
            }),
        }))
    }

    async fn get_staff(
        &self,
        request: Request<GetStaffRequest>,
    ) -> Result<Response<StaffResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;
        let staff_id = Uuid::parse_str(&req.staff_id)
            .map_err(|_| Status::invalid_argument("Invalid staff_id"))?;

        let row = sqlx::query_as::<_, (Uuid, Uuid, String, String, Option<String>, bool, chrono::DateTime<chrono::Utc>)>(
            r#"SELECT s.id, s.user_id, s.employee_number, s.designation, s.department, s.is_active, s.created_at
               FROM staff s WHERE s.id = $1 AND s.tenant_id = $2"#,
        )
        .bind(staff_id)
        .bind(tenant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Query error: {e}")))?;

        match row {
            Some(r) => {
                let full_name: String = sqlx::query_scalar("SELECT full_name FROM users WHERE id = $1")
                    .bind(r.1)
                    .fetch_optional(&self.pool)
                    .await
                    .map_err(|e| Status::internal(format!("User query error: {e}")))?
                    .flatten()
                    .unwrap_or_default();

                Ok(Response::new(StaffResponse {
                    success: true,
                    message: "Staff found".into(),
                    staff: Some(StaffMember {
                        id: r.0.to_string(),
                        user_id: r.1.to_string(),
                        employee_number: r.2,
                        designation: r.3,
                        department: r.4.unwrap_or_default(),
                        full_name,
                        is_active: r.5,
                        created_at: r.6.to_rfc3339(),
                    }),
                }))
            }
            None => Err(Status::not_found("Staff not found")),
        }
    }

    async fn list_staff(
        &self,
        request: Request<ListStaffRequest>,
    ) -> Result<Response<ListStaffResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let mut query = String::from(
            "SELECT s.id, s.user_id, s.employee_number, s.designation, s.department, \
             s.is_active, s.created_at, COALESCE(u.full_name, '') as full_name \
             FROM staff s LEFT JOIN users u ON s.user_id = u.id \
             WHERE s.tenant_id = $1"
        );
        if !req.designation.is_empty() {
            query.push_str(&format!(" AND s.designation = '{}'", req.designation));
        }
        query.push_str(" ORDER BY s.created_at");

        let rows = sqlx::query_as::<_, (Uuid, Uuid, String, String, Option<String>, bool, chrono::DateTime<chrono::Utc>, String)>(&query)
            .bind(tenant_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Query error: {e}")))?;

        let staff: Vec<StaffMember> = rows
            .into_iter()
            .map(|r| StaffMember {
                id: r.0.to_string(),
                user_id: r.1.to_string(),
                employee_number: r.2,
                designation: r.3,
                department: r.4.unwrap_or_default(),
                is_active: r.5,
                created_at: r.6.to_rfc3339(),
                full_name: r.7,
            })
            .collect();

        Ok(Response::new(ListStaffResponse { staff }))
    }
}

// ─────────────────────────────────────────────────────────────
// NumberService Implementation
// ─────────────────────────────────────────────────────────────

#[tonic::async_trait]
impl NumberService for SchoolService {
    async fn get_next_number(
        &self,
        request: Request<GetNextNumberRequest>,
    ) -> Result<Response<GetNextNumberResponse>, Status> {
        let req = request.into_inner();
        let tenant_id = Uuid::parse_str(&req.tenant_id)
            .map_err(|_| Status::invalid_argument("Invalid tenant_id"))?;

        let current_year: i32 = chrono::Utc::now().format("%y").to_string()
            .parse()
            .unwrap_or(25);

        // 1. Get tenant prefix (fallback to uppercase first 3 chars of slug)
        let prefix: String = sqlx::query_scalar(
            "SELECT COALESCE(NULLIF(prefix, ''), UPPER(LEFT(slug, 3))) FROM tenants WHERE id = $1"
        )
        .bind(tenant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Tenant query error: {e}")))?;

        let role_code = match req.r#type.as_str() {
            "student" => "S",
            "staff" => "T",
            _ => "X",
        };

        // 2. Ensure the sequence row exists without incrementing
        sqlx::query(
            r#"INSERT INTO number_sequences (tenant_id, type, year, next_sequence)
               VALUES ($1, $2, $3, 1)
               ON CONFLICT (tenant_id, type, year) DO NOTHING"#
        )
        .bind(tenant_id)
        .bind(&req.r#type)
        .bind(current_year)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Sequence init error: {e}")))?;

        // 3. Read the current next_sequence value
        let mut seq: i32 = sqlx::query_scalar(
            "SELECT next_sequence FROM number_sequences WHERE tenant_id = $1 AND type = $2 AND year = $3"
        )
        .bind(tenant_id)
        .bind(&req.r#type)
        .bind(current_year)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Sequence read error: {e}")))?;

        // 4. Check if the candidate number is already taken; if so, advance until vacant
        let table = match req.r#type.as_str() {
            "student" => "students",
            "staff" => "staff",
            _ => return Err(Status::invalid_argument("type must be 'student' or 'staff'")),
        };
        let number_col = match req.r#type.as_str() {
            "student" => "admission_number",
            _ => "employee_number",
        };

        let max_scan = 1000; // safety limit to avoid infinite loop
        for _ in 0..max_scan {
            let candidate = format!("{}-{}-{}{:03}", prefix, role_code, current_year, seq);

            let exists: bool = sqlx::query_scalar::<_, bool>(
                &format!(
                    "SELECT EXISTS(SELECT 1 FROM {} WHERE tenant_id = $1 AND {} = $2)",
                    table, number_col
                )
            )
            .bind(tenant_id)
            .bind(&candidate)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Existence check error: {e}")))?;

            if !exists {
                // Persist the current sequence position (no unnecessary increment)
                sqlx::query(
                    "UPDATE number_sequences SET next_sequence = $1 WHERE tenant_id = $2 AND type = $3 AND year = $4"
                )
                .bind(seq)
                .bind(tenant_id)
                .bind(&req.r#type)
                .bind(current_year)
                .execute(&self.pool)
                .await
                .map_err(|e| Status::internal(format!("Sequence update error: {e}")))?;

                return Ok(Response::new(GetNextNumberResponse {
                    success: true,
                    number: candidate,
                    message: "Number generated".into(),
                }));
            }

            seq += 1;
        }

        Err(Status::internal("Could not find a vacant number within scan limit"))
    }
}
