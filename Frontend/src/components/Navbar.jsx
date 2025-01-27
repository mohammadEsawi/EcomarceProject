import { Link, useLocation } from "react-router-dom";

const navigation = [
  { name: "Home", href: "/", current: false },
  { name: "Collections", href: "/collections", current: false },
  { name: "Testimonial", href: "/testimonial", current: false },
  { name: "Contact", href: "/contact", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar({ mobile }) {
  const location = useLocation();

  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href
  }));

  return (
    <nav className={`${mobile ? "space-y-1" : "hidden sm:flex space-x-4"}`}>
      {updatedNavigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={classNames(
            item.current
              ? "bg-secondary text-white"
              : "text-gray-900 hover:bg-gray-100",
            mobile 
              ? "block rounded-md px-3 py-2 text-base font-medium"
              : "rounded-md px-3 py-2 text-sm font-medium"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
