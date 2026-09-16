use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Verifiability {
    High,
    Medium,
    Low,
}

impl Verifiability {
    pub fn score(self) -> f64 {
        match self {
            Verifiability::High => 1.0,
            Verifiability::Medium => 0.6,
            Verifiability::Low => 0.3,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Confidence {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AssessInput {
    pub source_verifiability: Verifiability,
    pub payment_signal_present: bool,
    #[serde(default)]
    pub anomaly_flags: Vec<String>,
    #[serde(default)]
    pub time_series: Option<Vec<f64>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct CredibilityAssessment {
    pub verifiability_score: f64,
    pub anomaly_score: f64,
    pub payment_signal_present: bool,
    pub suggested_confidence: Confidence,
    pub raw: f64,
    pub reasons: Vec<String>,
    pub anomaly_flags: Vec<String>,
}

pub fn detect_time_series_anomaly(time_series: &Option<Vec<f64>>) -> (f64, Vec<String>) {
    let series = match time_series {
        Some(s) if s.len() >= 3 => s,
        _ => return (0.0, vec![]),
    };

    let mut flags = Vec::new();
    let mut max_jump: f64 = 0.0;
    for i in 1..series.len() {
        let prev = if series[i - 1] == 0.0 { 1.0 } else { series[i - 1] };
        let curr = series[i];
        let jump = ((curr - prev).abs()) / prev.abs().max(1.0);
        if jump > max_jump {
            max_jump = jump;
        }
    }
    if max_jump > 3.0 {
        flags.push("time_series_jump".to_string());
    }
    ((max_jump / 5.0).clamp(0.0, 1.0), flags)
}

pub fn assess(input: AssessInput) -> CredibilityAssessment {
    let verifiability_score = input.source_verifiability.score();
    let (time_score, time_flags) = detect_time_series_anomaly(&input.time_series);

    let base_flags = input.anomaly_flags.clone();
    let anomaly_base = ((base_flags.len() as f64) * 0.15).min(0.45);
    let anomaly_score = (anomaly_base + time_score * 0.25).clamp(0.0, 1.0);

    let payment_score = if input.payment_signal_present { 1.0 } else { 0.0 };

    let raw = verifiability_score * 0.30 + payment_score * 0.45 + (1.0 - anomaly_score) * 0.25;

    let mut suggested = if raw >= 0.72 {
        Confidence::High
    } else if raw >= 0.45 {
        Confidence::Medium
    } else {
        Confidence::Low
    };

    if input.payment_signal_present && matches!(suggested, Confidence::Low) {
        suggested = Confidence::Medium;
    }

    let mut reasons = Vec::new();
    if input.payment_signal_present {
        reasons.push("存在真实付费信号".to_string());
    } else {
        reasons.push("无付费信号".to_string());
    }
    if matches!(input.source_verifiability, Verifiability::Low) {
        reasons.push("来源可验证性低".to_string());
    }
    if matches!(input.source_verifiability, Verifiability::High) {
        reasons.push("来源可验证性高".to_string());
    }
    if anomaly_score > 0.3 {
        reasons.push("存在异常模式".to_string());
    }
    reasons.extend(time_flags.iter().cloned());

    let mut all_flags = base_flags;
    all_flags.extend(time_flags);

    CredibilityAssessment {
        verifiability_score,
        anomaly_score,
        payment_signal_present: input.payment_signal_present,
        suggested_confidence: suggested,
        raw,
        reasons,
        anomaly_flags: all_flags,
    }
}