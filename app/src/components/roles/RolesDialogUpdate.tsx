import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Button, CircularProgress, DialogActions } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";

import { DialogContainer } from "src/components/general/DialogContainer";
import { SnackbarText } from "src/components/general/SnackbarText";
import {
  IFormValues,
  RolesDialogForm,
} from "src/components/roles/RolesDialogForm";
import type { IResRoleItem } from "src/components/types";
import { fetcherTrigger } from "src/utils/fetcher";

interface IRolesDialogUpdateProps {
  handleDialogUpdateClose: () => void;
  isDialogUpdateOpen: boolean;
  role: IResRoleItem;
  roleList: IResRoleItem[];
}

const defaultValues: IFormValues = {
  name: "",
};
export const RolesDialogUpdate = ({
  handleDialogUpdateClose,
  isDialogUpdateOpen,
  role,
  roleList,
}: IRolesDialogUpdateProps) => {
  // fetching, mutation, and revalidation
  // --------------------
  const { isMutating, trigger } = useSWRMutation(
    `/api/roles/${role.roleId}`,
    fetcherTrigger
  );
  const { mutate } = useSWRConfig();

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  useEffect(() => {
    setValue("name", role.roleName);
  }, [role, setValue]);

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      // update database
      await trigger({
        body: formValues,
        method: "PATCH",
      });
      mutate("/api/roles");

      handleDialogUpdateClose();
      reset(defaultValues);
      enqueueSnackbar(
        <SnackbarText>
          <strong>{formValues.name}</strong> role has been updated
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

  // display
  // --------------------
  return (
    <DialogContainer
      handleDialogClose={handleDialogUpdateClose}
      isDialogOpen={isDialogUpdateOpen}
      text="Update role"
    >
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <RolesDialogForm
          control={control}
          errors={errors}
          roleList={roleList}
        />
        <DialogActions>
          <Button
            disabled={isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <CloseIcon />
            }
            onClick={() => {
              handleDialogUpdateClose();
              reset(defaultValues);
            }}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={Object.keys(errors).length > 0 || isMutating}
            startIcon={
              isMutating ? <CircularProgress size="1rem" /> : <EditIcon />
            }
            type="submit"
            variant="contained"
          >
            Update role
          </Button>
        </DialogActions>
      </form>
    </DialogContainer>
  );
};
