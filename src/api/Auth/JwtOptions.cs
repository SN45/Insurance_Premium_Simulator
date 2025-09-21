namespace Api.Auth
{
    public class JwtOptions
    {
        public string Issuer { get; set; } = "premium-simulator";
        public string Audience { get; set; } = "premium-simulator";
        public string SigningKey { get; set; } = ""; // set via env
        public int ExpMinutes { get; set; } = 60 * 24;
    }
}
