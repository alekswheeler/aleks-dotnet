using System.Globalization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
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
builder.Services.AddLocalization();

builder.Services.AddDbContextFactory<DatabaseContext>(options =>
    options.UseSqlite("Data Source=meubanco.db"));

var app = builder.Build();

var js = app.Services.GetRequiredService<IJSRuntime>();
string? savedCulture = null;
try
{
    savedCulture = await js.InvokeAsync<string>("blazorCulture.get");
}
catch
{
    savedCulture = null;
}

var supported = new[] { "en", "pt-BR" };
var cultureName = supported.Contains(savedCulture) ? savedCulture! : "pt-BR";

CultureInfo culture;
try
{
    culture = new CultureInfo(cultureName);
}
catch (CultureNotFoundException)
{
    culture = new CultureInfo("pt-BR");
}

try
{
    CultureInfo.DefaultThreadCurrentCulture = culture;
    CultureInfo.DefaultThreadCurrentUICulture = culture;
}
catch
{
    // Never let a bad culture white-screen the app: boot with defaults.
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
    context.Database.EnsureCreated();
}

await app.RunAsync();