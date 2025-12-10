class UserProfile
{
    public Guid Id { get; set; }

    public string ClerkUserId { get; set; } = null!;
    public string? Name { get; set; }
    public string? Email { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}