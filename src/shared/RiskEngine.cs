namespace Shared;

public record RiskComponent(
  string Metric,
  double Weight,
  bool HigherIsBetter,
  double CapMin,
  double CapMax,
  double Normalized,   // this is "badness" in [0..1]
  double Contribution  // weight * badness
);

public record RiskResult(double RiskScore, decimal Premium, List<RiskComponent> Components);

public static class RiskEngine
{
  /// <summary>
  /// Computes risk and premium.
  /// RiskScore ∈ [0,1]: 0 = best (least risk), 1 = worst (most risk).
  /// Premium = base * (1 + adj), where adj is linearly mapped:
  ///   risk=0  -> adj = minAdj (discount, e.g., -0.20 = -20%)
  ///   risk=1  -> adj = maxAdj (surcharge, e.g., +0.40 = +40%)
  /// </summary>
  public static RiskResult Compute(
    decimal basePremium,
    Dictionary<string,double> metrics,
    IEnumerable<RiskWeight> weights,
    decimal minAdj = -0.20m,   // 20% discount at perfect risk
    decimal maxAdj = +0.40m    // 40% surcharge at worst risk
  )
  {
    var comps = new List<RiskComponent>();
    double riskSum = 0;

    foreach (var w in weights)
    {
      metrics.TryGetValue(w.Metric, out var raw);

      // Normalize raw value to [0..1] inside caps
      var clamped = Math.Clamp(raw, w.CapMin, w.CapMax);
      var span = w.CapMax - w.CapMin;
      var norm = span <= 0 ? 0.0 : (clamped - w.CapMin) / (span + 1e-9); // [0..1]

      // Convert to "badness" (risk contribution in [0..1])
      var higherIsBetter = w.Direction.Equals("HigherIsBetter", StringComparison.OrdinalIgnoreCase);
      var badness = higherIsBetter ? (1 - norm) : norm;

      var contrib = w.Weight * badness;
      comps.Add(new RiskComponent(w.Metric, w.Weight, higherIsBetter, w.CapMin, w.CapMax, badness, contrib));
      riskSum += contrib;
    }

    // assume weights sum ~1.0
    var riskScore = Math.Clamp(riskSum, 0.0, 1.0);

    // Map risk -> linear discount/surcharge
    var adj = minAdj + (decimal)riskScore * (maxAdj - minAdj); // lerp(minAdj,maxAdj,risk)
    var premium = basePremium * (1 + adj);

    return new RiskResult(riskScore, decimal.Round(premium, 2), comps);
  }
}
