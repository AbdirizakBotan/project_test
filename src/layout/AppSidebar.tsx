import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  CloseIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

import { DollarLineIcon } from "../icons";

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "Admins",
    path: "/admins",
    icon: <UserCircleIcon />,
  },
  {
    name: "Members",
    path: "/members",
    icon: <GroupIcon />,
  },
  {
    name: "Locked Admins",
    path: "/locked-admins",
    icon: <CloseIcon />,
  },
  {
    name: "Payments",
    path: "/payments",
    icon: <DollarLineIcon />,
  },
];

// Define othersItems as an empty array or with your desired items
const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(path + "/"),
    [location.pathname]
  );

  // Filter navItems based on user roles
  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (
      item.name === "Admins" ||
      item.name === "Locked Admins" ||
      item.name === "Payments"
    ) {
      return user.role === "super-admin";
    }
    if (item.name === "Members") {
      return user.role === "admin" || user.role === "super-admin";
    }
    return true;
  });

  useEffect(() => {
    let submenuMatched = false;
    ["main"].forEach((menuType) => {
      const items = menuType === "main" ? filteredNavItems : othersItems;
      items.forEach((nav: NavItem, index: number) => {
        if (nav.subItems) {
          nav.subItems.forEach(
            (subItem: {
              name: string;
              path: string;
              pro?: boolean;
              new?: boolean;
            }) => {
              if (isActive(subItem.path)) {
                setOpenSubmenu({
                  type: menuType as "main",
                  index,
                });
                submenuMatched = true;
              }
            }
          );
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, filteredNavItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Remove 'items' parameter as it's not used
  const renderMenuItems = (menuType: "main") => (
    <ul className="flex flex-col gap-4">
      {(menuType === "main" ? filteredNavItems : othersItems).map(
        (nav: NavItem, index: number) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map(
                    (subItem: {
                      name: string;
                      path: string;
                      pro?: boolean;
                      new?: boolean;
                    }) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </li>
        )
      )}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo_black.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo_color.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo_icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems("main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
