import {
  ManageAccounts as ManageAccountsIcon,
  MoreHoriz,
  SpeakerNotes as SpeakerNotesIcon,
  SpeakerNotesOff as SpeakerNotesOffIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Container,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { green, grey, red } from "@mui/material/colors";
import { FilterType } from "mui-datatables";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { Hero } from "src/components/layout/Hero";
import type { IVolunteerShiftCountItem } from "src/components/types";
import { fetcherGet } from "src/utils/fetcher";

const setCellHeaderPropsCenter = () => ({
  className: "center",
});
const setCellPropsCenter = () => ({
  style: {
    textAlign: "center",
  },
});
const sortCompareShiftCount = (order: string) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteer1: { [key: string]: any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volunteer2: { [key: string]: any }
  ) => {
    const value1 =
      volunteer1.data.props.label || Number(volunteer1.data.props.children);
    const value2 =
      volunteer2.data.props.label || Number(volunteer2.data.props.children);

    return (value1 - value2) * (order === "asc" ? 1 : -1);
  };
};

export const Volunteers = () => {
  const { data, error } = useSWR("/api/volunteers", fetcherGet);
  const theme = useTheme();

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // prepare datatable
  const columnList = [
    {
      name: "Shiftboard ID - hidden",
      options: { display: false, filter: false }, // hide for row click
    },
    {
      name: "Playa name",
      options: {
        filter: false,
        sortThirdClickReset: true,
      },
    },
    {
      name: "World name",
      options: {
        filter: false,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Att.",
      options: {
        filter: false,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: sortCompareShiftCount,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Abs.",
      options: {
        customFilterListOptions: {
          render: (value: string) => `Absent: ${value}`,
        },
        filterOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logic: (value: any, filterValue: string[]) => {
            const count = value.props.label || Number(value.props.children);
            const show = filterValue.indexOf("One or more") >= 0 && count > 0;

            // returning false means that the value will display
            return !show;
          },
          names: ["One or more"],
        },
        filterType: "checkbox" as FilterType,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: sortCompareShiftCount,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Rem.",
      options: {
        customFilterListOptions: {
          render: (value: string) => `Remaining: ${value}`,
        },
        filterOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logic: (value: any, filterValue: string[]) => {
            const count = value.props.label || Number(value.props.children);
            const show = filterValue.indexOf("One or more") >= 0 && count > 0;

            // returning false means that the value will display
            return !show;
          },
          names: ["One or more"],
        },
        filterType: "checkbox" as FilterType,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: sortCompareShiftCount,
        sortThirdClickReset: true,
      },
    },
    {
      name: "Notes",
      options: {
        customFilterListOptions: {
          render: (value: string) => `Notes: ${value}`,
        },
        filterOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logic: (value: any, filterValue: string[]) => {
            const { color } = value.props;
            const show =
              filterValue.indexOf("Recorded") >= 0 && color === "primary";

            // returning false means that the value will display
            return !show;
          },
          names: ["Recorded"],
        },
        filterType: "checkbox" as FilterType,
        setCellHeaderProps: setCellHeaderPropsCenter,
        setCellProps: setCellPropsCenter,
        sortCompare: (order: string) => {
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            volunteer1: { [key: string]: any },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            volunteer2: { [key: string]: any }
          ) => {
            const value1 = volunteer1.data.props.color;
            const value2 = volunteer2.data.props.color;

            return value1 > value2 && order === "asc" ? 1 : -1;
          };
        },
        sortThirdClickReset: true,
      },
    },
    {
      name: "Actions",
      options: {
        filter: false,
        sort: false,
      },
    },
  ];
  const dataTable = data.map(
    ({
      attendedCount,
      isNotes,
      noShowCount,
      playaName,
      remainingCount,
      shiftboardId,
      worldName,
    }: IVolunteerShiftCountItem) => {
      return [
        shiftboardId,
        playaName,
        worldName,
        attendedCount > 0 ? (
          <Typography sx={{ fontSize: "14px" }}>{attendedCount}</Typography>
        ) : (
          <Typography sx={{ color: grey[500], fontSize: "14px" }}>0</Typography>
        ),
        noShowCount > 0 ? (
          <Chip label={noShowCount} sx={{ background: red[100] }} />
        ) : (
          <Typography sx={{ color: grey[500], fontSize: "14px" }}>0</Typography>
        ),
        remainingCount > 0 ? (
          <Chip label={remainingCount} sx={{ background: green[100] }} />
        ) : (
          <Typography sx={{ color: grey[500], fontSize: "14px" }}>0</Typography>
        ),
        isNotes ? (
          <SpeakerNotesIcon color="primary" />
        ) : (
          <SpeakerNotesOffIcon color="disabled" />
        ),
        <MoreMenu
          Icon={<MoreHoriz />}
          key={`${shiftboardId}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/volunteers/${shiftboardId}`}>
                <MenuItem>
                  <ListItemIcon>
                    <ManageAccountsIcon />
                  </ListItemIcon>
                  <ListItemText>View account</ListItemText>
                </MenuItem>
              </Link>
            </MenuList>
          }
        />,
      ];
    }
  );
  const optionListCustom = {};

  return (
    <>
      <Hero
        Image={
          <Image
            alt="census volunteers cheering"
            fill
            priority
            src="/volunteers/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Volunteers"
      />
      <Container component="main">
        <Box component="section">
          <Stack direction="row" sx={{ mb: 2 }}>
            <Typography component="p" variant="h6">
              Att.
              <br />
              Abs.
              <br />
              Rem.
            </Typography>
            <Divider
              flexItem
              orientation="vertical"
              sx={{ marginX: theme.spacing(2) }}
              variant="middle"
            />
            <Typography component="p" variant="h6">
              Attended
              <br />
              Absent
              <br />
              Remaining
            </Typography>
          </Stack>
          <DataTable
            columnList={columnList}
            dataTable={dataTable}
            optionListCustom={optionListCustom}
          />
        </Box>
      </Container>
    </>
  );
};
