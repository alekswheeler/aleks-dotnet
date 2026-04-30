using HelloBlazor.Models;
using Microsoft.EntityFrameworkCore;

namespace HelloBlazor.Persistence
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }
        public DbSet<User> Users { get; set; }
    }
}