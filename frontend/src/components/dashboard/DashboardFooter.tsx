'use client';

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6 mt-auto print:hidden">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {currentYear} TukioHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
