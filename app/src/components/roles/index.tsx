import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Groups3 as Groups3Icon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Switch,
  TextField,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import io from "socket.io-client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { DataTable } from "src/components/general/DataTable";
import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { MoreMenu } from "src/components/general/MoreMenu";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import { RolesDialogDelete } from "src/components/roles/RolesDialogDelete";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

interface IRoleItem {
  display: boolean;
  name: string;
}

interface IFormValues {
  name: string;
}

const socket = io();
const defaultValues: IFormValues = {
  name: "",
};
export const Roles = () => {
  const { data, error, mutate } = useSWR("/api/roles", fetcherGet);
  const { isMutating, trigger } = useSWRMutation("/api/roles", fetcherTrigger);
  const { control, handleSubmit, reset } = useForm({
    defaultValues,
  });
  const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState({
    isOpen: false,
    role: {
      name: "",
    },
  });
  const { enqueueSnackbar } = useSnackbar();

  // listen for socket events
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket");

        socket.on("res-role-create", ({ name }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            dataMutate.roleList.push({
              name,
            });

            mutate(dataMutate);
          }
        });
        socket.on(
          "res-role-display-toggle",
          ({ checked, name }: { checked: boolean; name: string }) => {
            if (data) {
              const dataMutate = structuredClone(data);
              const roleItemUpdate = dataMutate.roleList.find(
                (roles: string) => roles === name
              );
              if (roleItemUpdate) {
                roleItemUpdate.display = checked;
              }

              mutate(dataMutate);
            }
          }
        );
        socket.on("res-role-delete", ({ name }) => {
          if (data) {
            const dataMutate = structuredClone(data);
            const roleListNew = dataMutate.roleList.filter(
              (roleItem: IRoleItem) => roleItem.name !== name
            );
            dataMutate.roleList = roleListNew;

            mutate(dataMutate);
          }
        });
      } catch (error) {
        if (error instanceof Error) {
          enqueueSnackbar(
            <SnackbarText>
              <strong>{error.message}</strong>
            </SnackbarText>,
            {
              persist: true,
              variant: "error",
            }
          );
        }

        throw error;
      }
    })();
  }, [data, enqueueSnackbar, mutate]);

  if (error) return <ErrorPage />;
  if (!data) return <Loading />;

  // handle display toggle
  const handleDisplayToggle = async ({
    checked,
    name,
  }: {
    checked: boolean;
    name: string;
  }) => {
    try {
      await trigger({
        body: {
          checked,
          name,
        },
        method: "PATCH",
      });
      socket.emit("req-role-display-toggle", {
        checked,
        name,
      });
      enqueueSnackbar(
        <SnackbarText>
          <strong>{name}</strong> role display has been set to{" "}
          <strong>{checked ? "on" : "off"}</strong>
        </SnackbarText>,
        {
          variant: "success",
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
      }

      throw error;
    }
  };
  // prepare datatable
  const columnList = [
    {
      name: "Name",
      options: {
        sortThirdClickReset: true,
      },
    },
    {
      name: "Display",
      options: {
        filter: false,
        sort: false,
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
  const dataTable = data.roleList.map(({ display, name }: IRoleItem) => {
    // if role name is admin
    // then disable display and delete actions
    if (name === "Admin") {
      return [
        name,
        <Switch disabled checked={display} key={`${name}-switch`} />,
        <MoreMenu
          Icon={<MoreHorizIcon />}
          key={`${name}-menu`}
          MenuList={
            <MenuList>
              <Link href={`/roles/${encodeURI(name)}`}>
                <MenuItem>
                  <ListItemIcon>
                    <Groups3Icon />
                  </ListItemIcon>
                  <ListItemText>View volunteers</ListItemText>
                </MenuItem>
              </Link>
            </MenuList>
          }
        />,
      ];
    }

    return [
      name,
      <Switch
        checked={display}
        onChange={(event) =>
          handleDisplayToggle({
            checked: event.target.checked,
            name,
          })
        }
        key={`${name}-switch`}
      />,
      <MoreMenu
        Icon={<MoreHorizIcon />}
        key={`${name}-menu`}
        MenuList={
          <MenuList>
            <Link href={`/roles/${encodeURI(name)}`}>
              <MenuItem>
                <ListItemIcon>
                  <Groups3Icon />
                </ListItemIcon>
                <ListItemText>View volunteers</ListItemText>
              </MenuItem>
            </Link>
            <MenuItem
              onClick={() =>
                setIsDialogDeleteOpen({
                  isOpen: true,
                  role: { name },
                })
              }
            >
              <ListItemIcon>
                <DeleteIcon />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </MenuList>
        }
      />,
    ];
  });
  const optionListCustom = { filter: false };

  // handle form submission
  const onSubmit: SubmitHandler<IFormValues> = async (dataForm) => {
    try {
      const isRoleAvailable = data.roleList.some(
        ({ name }: { name: string }) => name === dataForm.name
      );

      // if the role has been added already
      // then display an error
      if (isRoleAvailable) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{dataForm.name}</strong> role has been added already
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
        return;
      }

      // update database
      await trigger({ body: dataForm, method: "POST" });
      // emit shift update
      socket.emit("req-role-create", {
        dataForm,
      });

      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{dataForm.name}</strong> role has been created
        </SnackbarText>,
        {
          variant: "success",
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        enqueueSnackbar(
          <SnackbarText>
            <strong>{error.message}</strong>
          </SnackbarText>,
          {
            persist: true,
            variant: "error",
          }
        );
      }

      throw error;
    }
  };

  return (
    <>
      <Hero
        Image={
          <Image
            alt="census camp at burning man"
            fill
            priority
            src="/home/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Roles"
      />
      <Container component="main">
        <DataTable
          columnList={columnList}
          dataTable={dataTable}
          optionListCustom={optionListCustom}
        />
        <Card>
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextField
                    {...field}
                    autoComplete="off"
                    disabled={isMutating}
                    fullWidth
                    label="Name"
                    required
                    variant="standard"
                  />
                )}
              />
            </CardContent>
            <CardActions
              sx={{
                justifyContent: "flex-end",
                pb: 2,
                pt: 0,
                pr: 2,
              }}
            >
              <Button
                disabled={isMutating}
                startIcon={
                  isMutating ? <CircularProgress size="sm" /> : <AddIcon />
                }
                type="submit"
                variant="contained"
              >
                Create role
              </Button>
            </CardActions>
          </form>
        </Card>
      </Container>

      {/* delete dialog */}
      <RolesDialogDelete
        handleDialogDeleteClose={() =>
          setIsDialogDeleteOpen({
            isOpen: false,
            role: {
              name: "",
            },
          })
        }
        isDialogDeleteOpen={isDialogDeleteOpen.isOpen}
        role={isDialogDeleteOpen.role}
      />
    </>
  );
};
