namespace Api.Contracts
{
    public record RegisterDto(string FullName, string Email, string PhoneNumber, string Password);
    public record LoginDto(string Email, string Password);
}
