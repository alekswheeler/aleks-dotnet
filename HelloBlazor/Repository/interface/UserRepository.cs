using HelloBlazor.Models;

namespace HelloBlazor.Persistence
{
    public interface UserRepository : Repository<User>
    {
        public Task AddUser(User user);
        public Task<User[]> GetUser();
        public new User GetByKey(string parKey, string parValue) => throw new NotImplementedException();
    }
}
