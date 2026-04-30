using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using HelloBlazor;
using HelloBlazor.Services;
using Microsoft.EntityFrameworkCore;
using HelloBlazor.Persistence;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<UserRepository, UserRepositoryImpl>();

builder.Services.AddScoped<HeroImageService>();

builder.Services.AddDbContextFactory<DatabaseContext>(options => 
    options.UseSqlite("Data Source=meubanco.db"));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
    context.Database.EnsureCreated();
}

await app.RunAsync();