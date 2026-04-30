using System.ComponentModel.DataAnnotations;

namespace HelloBlazor.Models;
public class User
{
    #region Attribute
    public string Password { get; set; } = "";
    public string Email { get; set; } = "";
    public string Name { get; init; } = "";
    [Key]
    public int Id {get; set;} = 1;
    #endregion
    #region Method
    public bool SetPassword(string Password)
    {
        this.Password = "";
        return false;
    }
    #endregion
    #region Constructor
    public User() { } 
    public User(string Name, string Email)
    {
        this.Name = Name;
        this.Email = Email;
        Password = "";
        Id = 2;
    }
    public User(string Name, string Email, int Id)
    {
        this.Name = Name;
        this.Email = Email;
        Password = "";
        this.Id = Id;
    }
    #endregion
}