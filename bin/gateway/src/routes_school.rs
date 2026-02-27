//! REST → gRPC bridge for School plugin (Students & Staff).

use axum::{
    extract::{Json, Path, Query},
    response::IntoResponse,
};
use serde::Deserialize;

use crate::audit_helper::record_audit_async;
use erp_proto::school::student_service_client::StudentServiceClient;
use erp_proto::school::staff_service_client::StaffServiceClient;
use erp_proto::school::number_service_client::NumberServiceClient;
use erp_proto::auth::auth_service_client::AuthServiceClient;
use erp_proto::tenancy::tenancy_service_client::TenancyServiceClient;
use erp_proto::school::*;
use erp_proto::auth::RegisterRequest;
use erp_proto::tenancy::{GetTenantRequest, AddUserToTenantRequest};
use rand::{distributions::Alphanumeric, Rng};

fn school_addr() -> String {
    std::env::var("SCHOOL_SERVICE_ADDR").unwrap_or_else(|_| "http://127.0.0.1:50060".into())
}

/// Convert a proto Student to JSON value
fn student_to_json(s: &Student) -> serde_json::Value {
    serde_json::json!({
        "id": s.id,
        "admission_number": s.admission_number,
        "first_name": s.first_name,
        "last_name": s.last_name,
        "class_grade": s.class_grade,
        "section": s.section,
        "parent_email": s.parent_email,
        "class_teacher_id": s.class_teacher_id,
        "is_active": s.is_active,
        "created_at": s.created_at,
        "user_id": s.user_id,
    })
}

/// Convert a proto StaffMember to JSON value
fn staff_to_json(s: &StaffMember) -> serde_json::Value {
    serde_json::json!({
        "id": s.id,
        "user_id": s.user_id,
        "employee_number": s.employee_number,
        "designation": s.designation,
        "department": s.department,
        "full_name": s.full_name,
        "is_active": s.is_active,
        "created_at": s.created_at,
    })
}

// ── POST /api/v1/school/students ──

#[derive(Deserialize)]
pub struct AdmitStudentBody {
    pub tenant_id: String,
    pub admission_number: String,
    pub first_name: String,
    pub last_name: String,
    pub class_grade: i32,
    pub section: Option<String>,
    pub parent_email: Option<String>,
    pub date_of_birth: Option<String>,
    pub class_teacher_id: Option<String>,
}

fn auth_addr() -> String {
    std::env::var("AUTH_SERVICE_ADDR").unwrap_or_else(|_| "http://127.0.0.1:50052".into())
}

fn tenancy_addr() -> String {
    std::env::var("TENANCY_SERVICE_ADDR").unwrap_or_else(|_| "http://127.0.0.1:50053".into())
}

fn generate_password(length: usize) -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect()
}

fn generate_short_id() -> String {
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

pub async fn admit_student_handler(Json(body): Json<AdmitStudentBody>) -> impl IntoResponse {
    // 1. Fetch Tenant details for slug
    let mut tenancy_client = match TenancyServiceClient::connect(tenancy_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Tenancy Connect: {e}")})),
    };
    let tenant_resp = match tenancy_client.get_tenant(GetTenantRequest { tenant_id: body.tenant_id.clone() }).await {
        Ok(r) => r.into_inner(),
        Err(e) => return Json(serde_json::json!({"error": format!("GetTenant: {e}")})),
    };
    let tenant = match tenant_resp.tenant {
        Some(t) => t,
        None => return Json(serde_json::json!({"error": "Tenant not found"})),
    };

    // 2. Generate Credentials
    let password = generate_password(10);
    let full_name = format!("{} {}", body.first_name, body.last_name);

    // 3. Register User (retry with new short_id on email collision)
    let mut auth_client = match AuthServiceClient::connect(auth_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Auth Connect: {e}")})),
    };

    let mut email = String::new();
    let mut user_id = String::new();
    let max_retries = 5;
    for attempt in 0..max_retries {
        let short_id = generate_short_id();
        email = format!("{}@{}.com", short_id, tenant.slug);

        let auth_resp = match auth_client.register(RegisterRequest {
            email: email.clone(),
            password: password.clone(),
            full_name: full_name.clone(),
        }).await {
            Ok(r) => r.into_inner(),
            Err(e) => return Json(serde_json::json!({"error": format!("Register: {e}")})),
        };

        if auth_resp.success {
            user_id = auth_resp.user_id;
            break;
        }

        if attempt == max_retries - 1 {
            return Json(serde_json::json!({"error": "Failed to generate unique username after retries"}));
        }
    }

    // 4. Assign User to Tenant (Student Role)
    match tenancy_client.add_user_to_tenant(AddUserToTenantRequest { tenant_id: body.tenant_id.clone(), user_id: user_id.clone(), role: "student".into() }).await {
        Ok(_) => {}
        Err(e) => return Json(serde_json::json!({"error": format!("AddUserToTenant: {e}")})),
    };

    // 5. Admit Student in School Plugin
    let mut client = match StudentServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("School Connect: {e}")})),
    };
    let tenant_id_audit = body.tenant_id.clone();
    let user_id_audit = user_id.clone();
    match client
        .admit_student(AdmitStudentRequest {
            tenant_id: body.tenant_id,
            admission_number: body.admission_number,
            first_name: body.first_name,
            last_name: body.last_name,
            class_grade: body.class_grade,
            section: body.section.unwrap_or_default(),
            parent_email: body.parent_email.unwrap_or_default(),
            date_of_birth: body.date_of_birth.unwrap_or_default(),
            class_teacher_id: body.class_teacher_id.unwrap_or_default(),
            user_id,
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            if r.success {
                let student_id = r.student.as_ref().map(|s| s.id.clone()).unwrap_or_default();
                record_audit_async(
                    tenant_id_audit,
                    user_id_audit,
                    email.clone(),
                    "STUDENT_ADMITTED",
                    "student",
                    student_id,
                    serde_json::json!({"name": full_name}).to_string(),
                );
            }
            Json(serde_json::json!({
                "success": r.success,
                "message": r.message,
                "student": r.student.as_ref().map(student_to_json),
                "credentials": {
                    "email": email,
                    "password": password
                }
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── GET /api/v1/school/students/:tenant_id ──

#[derive(Deserialize)]
pub struct ListStudentsQuery {
    pub class_grade: Option<i32>,
    pub section: Option<String>,
}

pub async fn list_students_handler(
    Path(tenant_id): Path<String>,
    Query(q): Query<ListStudentsQuery>,
) -> impl IntoResponse {
    let mut client = match StudentServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .list_students(ListStudentsRequest {
            tenant_id,
            class_grade: q.class_grade.unwrap_or(0),
            section: q.section.unwrap_or_default(),
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            let students: Vec<serde_json::Value> = r.students.iter().map(student_to_json).collect();
            Json(serde_json::json!({ "students": students }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── GET /api/v1/school/student/:tenant_id/:student_id ──

pub async fn get_student_handler(
    Path((tenant_id, student_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let mut client = match StudentServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .get_student(GetStudentRequest {
            tenant_id,
            student_id,
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            Json(serde_json::json!({
                "success": r.success,
                "student": r.student.as_ref().map(student_to_json),
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── PUT /api/v1/school/student/:tenant_id/:student_id ──

#[derive(Deserialize)]
pub struct UpdateStudentBody {
    pub first_name: String,
    pub last_name: String,
    pub class_grade: i32,
    pub section: Option<String>,
    pub parent_email: Option<String>,
    pub class_teacher_id: Option<String>,
    pub is_active: Option<bool>,
    pub editor_user_id: Option<String>,
    pub editor_email: Option<String>,
}

pub async fn update_student_handler(
    Path((tenant_id, student_id)): Path<(String, String)>,
    Json(body): Json<UpdateStudentBody>,
) -> impl IntoResponse {
    let mut client = match StudentServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };

    let tid = tenant_id.clone();
    let sid = student_id.clone();
    let editor_uid = body.editor_user_id.clone().unwrap_or_default();
    let editor_email = body.editor_email.clone().unwrap_or_default();
    let full_name = format!("{} {}", body.first_name, body.last_name);

    match client
        .update_student(UpdateStudentRequest {
            tenant_id,
            student_id,
            first_name: body.first_name,
            last_name: body.last_name,
            class_grade: body.class_grade,
            section: body.section.unwrap_or_default(),
            parent_email: body.parent_email.unwrap_or_default(),
            class_teacher_id: body.class_teacher_id.unwrap_or_default(),
            is_active: body.is_active.unwrap_or(true),
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            if r.success {
                record_audit_async(
                    tid,
                    editor_uid,
                    editor_email,
                    "STUDENT_UPDATED",
                    "student",
                    sid,
                    serde_json::json!({"name": full_name}).to_string(),
                );
            }
            Json(serde_json::json!({
                "success": r.success,
                "message": r.message,
                "student": r.student.as_ref().map(student_to_json),
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── DELETE /api/v1/school/student/:tenant_id/:student_id ──

#[derive(Deserialize)]
pub struct DeleteStudentQuery {
    pub editor_user_id: Option<String>,
    pub editor_email: Option<String>,
}

pub async fn delete_student_handler(
    Path((tenant_id, student_id)): Path<(String, String)>,
    Query(q): Query<DeleteStudentQuery>,
) -> impl IntoResponse {
    let mut client = match StudentServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };

    let tid = tenant_id.clone();
    let sid = student_id.clone();
    let editor_uid = q.editor_user_id.unwrap_or_default();
    let editor_email = q.editor_email.unwrap_or_default();

    match client
        .delete_student(DeleteStudentRequest {
            tenant_id,
            student_id,
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            if r.success {
                let name = r.student.as_ref()
                    .map(|s| format!("{} {}", s.first_name, s.last_name))
                    .unwrap_or_default();
                record_audit_async(
                    tid,
                    editor_uid,
                    editor_email,
                    "STUDENT_DELETED",
                    "student",
                    sid,
                    serde_json::json!({"name": name}).to_string(),
                );
            }
            Json(serde_json::json!({
                "success": r.success,
                "message": r.message,
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── POST /api/v1/school/student/:tenant_id/:student_id/password ──

#[derive(Deserialize)]
pub struct UpdateStudentPasswordBody {
    pub new_password: Option<String>,
    pub editor_user_id: Option<String>,
    pub editor_email: Option<String>,
}

pub async fn update_student_password_handler(
    Path((tenant_id, student_id)): Path<(String, String)>,
    Json(body): Json<UpdateStudentPasswordBody>,
) -> impl IntoResponse {
    // 1. Get student to find their user_id
    let mut school_client = match StudentServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };

    let student_resp = match school_client.get_student(GetStudentRequest {
        tenant_id: tenant_id.clone(),
        student_id: student_id.clone(),
    }).await {
         Ok(r) => r.into_inner(),
         Err(e) => return Json(serde_json::json!({"error": format!("Get Student failed: {e}")})),
    };

    let student = match student_resp.student {
         Some(s) => s,
         None => return Json(serde_json::json!({"error": "Student not found"})),
    };

    if student.user_id.is_empty() {
        return Json(serde_json::json!({"error": "Student does not have an associated login user"}));
    }

    let new_password = match &body.new_password {
        Some(p) if !p.is_empty() => p.clone(),
        _ => generate_password(10),
    };

    let mut auth_client = match AuthServiceClient::connect(auth_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Auth Connect: {e}")})),
    };

    let auth_resp = match auth_client.update_password(erp_proto::auth::UpdatePasswordRequest {
        user_id: student.user_id.clone(),
        new_password: new_password.clone(),
    }).await {
        Ok(r) => r.into_inner(),
        Err(e) => return Json(serde_json::json!({"error": format!("UpdatePassword failed: {e}")})),
    };

    if !auth_resp.success {
        return Json(serde_json::json!({"error": auth_resp.message}));
    }

    // Optional: Log the audit event for password reset.
    let editor_uid = body.editor_user_id.clone().unwrap_or_default();
    let editor_email = body.editor_email.clone().unwrap_or_default();
    let full_name = format!("{} {}", student.first_name, student.last_name);

    record_audit_async(
        tenant_id,
        editor_uid,
        editor_email,
        "STUDENT_PASSWORD_RESET",
        "student",
        student_id.clone(),
        serde_json::json!({"name": full_name}).to_string(),
    );

    Json(serde_json::json!({
        "success": true,
        "message": "Password updated successfully",
        "new_password": new_password,
    }))
}

// ── POST /api/v1/school/staff ──

#[derive(Deserialize)]
pub struct OnboardStaffBody {
    pub tenant_id: String,
    pub first_name: String,
    pub last_name: String,
    pub employee_number: String,
    pub designation: Option<String>,
    pub department: Option<String>,
}

pub async fn onboard_staff_handler(Json(body): Json<OnboardStaffBody>) -> impl IntoResponse {
    // 1. Fetch Tenant details for slug
    let mut tenancy_client = match TenancyServiceClient::connect(tenancy_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Tenancy Connect: {e}")})),
    };
    let tenant_resp = match tenancy_client.get_tenant(GetTenantRequest { tenant_id: body.tenant_id.clone() }).await {
        Ok(r) => r.into_inner(),
        Err(e) => return Json(serde_json::json!({"error": format!("GetTenant: {e}")})),
    };
    let tenant = match tenant_resp.tenant {
        Some(t) => t,
        None => return Json(serde_json::json!({"error": "Tenant not found"})),
    };

    // 2. Generate Credentials
    let password = generate_password(10);
    let full_name = format!("{} {}", body.first_name, body.last_name);

    // 3. Register User (retry with new short_id on email collision)
    let mut auth_client = match AuthServiceClient::connect(auth_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Auth Connect: {e}")})),
    };

    let mut email = String::new();
    let mut user_id = String::new();
    let max_retries = 5;
    for attempt in 0..max_retries {
        let short_id = generate_short_id();
        email = format!("{}@{}.com", short_id, tenant.slug);

        let auth_resp = match auth_client.register(RegisterRequest {
            email: email.clone(),
            password: password.clone(),
            full_name: full_name.clone(),
        }).await {
            Ok(r) => r.into_inner(),
            Err(e) => return Json(serde_json::json!({"error": format!("Register: {e}")})),
        };

        if auth_resp.success {
            user_id = auth_resp.user_id;
            break;
        }

        if attempt == max_retries - 1 {
            return Json(serde_json::json!({"error": "Failed to generate unique username after retries"}));
        }
    }

    // 4. Assign User to Tenant (Designation Role)
    let role = body.designation.clone().unwrap_or_else(|| "teacher".into());
    match tenancy_client.add_user_to_tenant(AddUserToTenantRequest { tenant_id: body.tenant_id.clone(), user_id: user_id.clone(), role }).await {
        Ok(_) => {}
        Err(e) => return Json(serde_json::json!({"error": format!("AddUserToTenant: {e}")})),
    };

    // 5. Onboard Staff in School Plugin
    let mut client = match StaffServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("School Connect: {e}")})),
    };
    let tenant_id_audit = body.tenant_id.clone();
    let user_id_audit = user_id.clone();
    let staff_name = full_name.clone();
    match client
        .onboard_staff(OnboardStaffRequest {
            tenant_id: body.tenant_id,
            user_id,
            employee_number: body.employee_number,
            designation: body.designation.unwrap_or_else(|| "teacher".into()),
            department: body.department.unwrap_or_default(),
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            if r.success {
                let sid = r.staff.as_ref().map(|s| s.id.clone()).unwrap_or_default();
                record_audit_async(
                    tenant_id_audit,
                    user_id_audit,
                    email.clone(),
                    "STAFF_ONBOARDED",
                    "staff",
                    sid,
                    serde_json::json!({"name": staff_name}).to_string(),
                );
            }
            Json(serde_json::json!({
                "success": r.success,
                "message": r.message,
                "staff": r.staff.as_ref().map(staff_to_json),
                "credentials": {
                    "email": email,
                    "password": password
                }
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── GET /api/v1/school/staff/:tenant_id ──

#[derive(Deserialize)]
pub struct ListStaffQuery {
    pub designation: Option<String>,
}

pub async fn list_staff_handler(
    Path(tenant_id): Path<String>,
    Query(q): Query<ListStaffQuery>,
) -> impl IntoResponse {
    let mut client = match StaffServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .list_staff(ListStaffRequest {
            tenant_id,
            designation: q.designation.unwrap_or_default(),
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            let staff: Vec<serde_json::Value> = r.staff.iter().map(staff_to_json).collect();
            Json(serde_json::json!({ "staff": staff }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

// ── GET /api/v1/school/staff/:tenant_id/:staff_id ──

pub async fn get_staff_handler(
    Path((tenant_id, staff_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let mut client = match StaffServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"error": format!("Connect: {e}")})),
    };
    match client
        .get_staff(GetStaffRequest {
            tenant_id,
            staff_id,
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            Json(serde_json::json!({
                "success": r.success,
                "staff": r.staff.as_ref().map(staff_to_json),
            }))
        }
        Err(e) => Json(serde_json::json!({"error": e.message()})),
    }
}

/// GET /api/v1/school/next-number/:tenant_id/:type
pub async fn get_next_number_handler(
    Path((tenant_id, number_type)): Path<(String, String)>,
) -> impl IntoResponse {
    let mut client = match NumberServiceClient::connect(school_addr()).await {
        Ok(c) => c,
        Err(e) => return Json(serde_json::json!({"success": false, "error": format!("School Connect: {e}")})),
    };
    match client
        .get_next_number(GetNextNumberRequest {
            tenant_id,
            r#type: number_type,
        })
        .await
    {
        Ok(resp) => {
            let r = resp.into_inner();
            Json(serde_json::json!({
                "success": r.success,
                "number": r.number,
                "message": r.message,
            }))
        }
        Err(e) => Json(serde_json::json!({"success": false, "error": e.message()})),
    }
}
