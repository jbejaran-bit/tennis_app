export function GET(request: Request) {
  return Response.redirect(new URL("/dashboard", request.url));
}
