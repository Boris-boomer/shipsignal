use crate::credibility::{assess, AssessInput, CredibilityAssessment};
use tauri::command;

#[command]
pub async fn assess_signal(input: AssessInput) -> Result<CredibilityAssessment, String> {
    Ok(assess(input))
}