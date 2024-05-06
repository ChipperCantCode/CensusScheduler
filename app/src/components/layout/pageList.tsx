import {
  Article as ArticleIcon,
  CalendarMonth as CalendarMonthIcon,
  DateRange as DateRangeIcon,
  Groups3 as Groups3Icon,
  Help as HelpIcon,
  Home as HomeIcon,
  List as ListIcon,
  QuestionAnswer as QuestionAnswerIcon,
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";

export const pageListDefault = [
  {
    icon: <HomeIcon />,
    label: "Home",
    path: "/",
  },
  {
    icon: <CalendarMonthIcon />,
    label: "Shifts",
    path: "/shifts",
  },
  {
    icon: <ArticleIcon />,
    label: "Reports",
    path: "/reports",
  },
  {
    icon: <HelpIcon />,
    label: "Help",
    path: "/help",
  },
  {
    icon: <QuestionAnswerIcon />,
    label: "Contact",
    path: "/contact",
  },
];

export const pageListAdmin = [
  {
    icon: <Groups3Icon />,
    label: "Volunteers",
    path: "/volunteers",
  },
  {
    icon: <VerifiedUserIcon />,
    label: "Roles",
    path: "/roles",
  },
];

export const pageListSuperAdmin = [
  {
    icon: <ListIcon />,
    label: "Shift categories",
    path: "/shifts/categories",
  },
  {
    icon: <DateRangeIcon />,
    label: "Shift types",
    path: "/shifts/types",
  },
];
