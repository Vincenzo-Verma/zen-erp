fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &[
                "proto/common.proto",
                "proto/health.proto",
                "proto/auth.proto",
                "proto/tenancy.proto",
                "proto/billing.proto",
                "proto/school.proto",
                "proto/audit.proto",
            ],
            &["proto/"],
        )?;

    Ok(())
}
