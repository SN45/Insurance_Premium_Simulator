namespace Shared;

public class User {
  public Guid Id { get; set; }
  public string Email { get; set; } = string.Empty;
  public string Name { get; set; } = string.Empty;
  public string Tier { get; set; } = "standard";
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public class Policy {
  public Guid Id { get; set; }
  public Guid UserId { get; set; }
  public decimal BasePremium { get; set; }
  public string CoverageType { get; set; } = "auto";
  public string Status { get; set; } = "active";
}
public class LifestyleMetric {
  public Guid Id { get; set; }
  public Guid UserId { get; set; }
  public DateOnly Date { get; set; }
  public int Steps { get; set; }
  public int RestingHR { get; set; }
  public double BMI { get; set; }
  public double SleepHours { get; set; }
  public int DrivingScore { get; set; }
  public int MilesDriven { get; set; }
}
public class RiskWeight {
  public Guid Id { get; set; }
  public string Metric { get; set; } = string.Empty;
  public double Weight { get; set; }
  public string Direction { get; set; } = "HigherIsBetter"; // or LowerIsBetter
  public double CapMin { get; set; }
  public double CapMax { get; set; }
  public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
}
public class PremiumQuote {
  public Guid Id { get; set; }
  public Guid PolicyId { get; set; }
  public DateTime QuoteDate { get; set; } = DateTime.UtcNow;
  public double RiskScore { get; set; }
  public decimal Premium { get; set; }
  public string BreakdownJson { get; set; } = "{}";
}
public class Reward {
  public Guid Id { get; set; }
  public Guid UserId { get; set; }
  public DateOnly Date { get; set; }
  public int Points { get; set; }
  public string Reason { get; set; } = string.Empty;
}
public class AuditLedger {
  public Guid Id { get; set; }
  public string Entity { get; set; } = string.Empty;
  public string EntityId { get; set; } = string.Empty;
  public string ChangeJson { get; set; } = string.Empty;
  public string Hash { get; set; } = string.Empty;
  public string PrevHash { get; set; } = string.Empty;
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
