export type AdminNavItem = {
  title: string;
  url: string;
  icon?: React.ReactNode;
  items?: AdminNavItem[];
};

export type AdminNavItems = {
  navMain: AdminNavItem[];
};
