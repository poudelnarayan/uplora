export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
    </div>
  );
}


