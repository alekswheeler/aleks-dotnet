using HelloBlazor.Models;
using Microsoft.EntityFrameworkCore;

namespace HelloBlazor.Persistence
{
    public class UserRepositoryImpl : UserRepository
    {
        #region Attribute
        private readonly IDbContextFactory<DatabaseContext> _factory;
        #endregion
        #region Method
        public UserRepositoryImpl(IDbContextFactory<DatabaseContext> factory)
        {
            _factory = factory;
        }

        public async Task AddUser(User user)
        {
            using var context = await _factory.CreateDbContextAsync();
            context.Add(user);
            await context.SaveChangesAsync();
        }

        public bool Delete(User parEntity)
        {
            throw new NotImplementedException();
        }

        public bool Delete(string parId)
        {
            throw new NotImplementedException();
        }

        public User GetByKey(string parKey, string parValue)
        {
            throw new NotImplementedException();
        }

        public async Task<User[]> GetUser()
        {
            User[] retValue = [];
            DatabaseContext dbContext;
            try
            {
                dbContext = await _factory.CreateDbContextAsync();
                retValue = [.. dbContext.Users.AsNoTracking()];
            }
            catch (Exception Err) { Console.Write(Err.Message); }
            return retValue;
        }

        public bool Save(User parEntity)
        {
            throw new NotImplementedException();
        }
        #endregion
    }
}
