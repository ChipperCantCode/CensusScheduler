import {
  Close as CloseIcon,
  DateRange as DateRangeIcon,
  EditCalendar as EditCalendarIcon,
} from "@mui/icons-material";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ErrorPage } from "src/components/general/ErrorPage";
import { Loading } from "src/components/general/Loading";
import { SnackbarText } from "src/components/general/SnackbarText";
import { Hero } from "src/components/layout/Hero";
import {
  defaultValues,
  findList,
  IFormValues,
  ShiftPositionsForm,
} from "src/components/shifts/positions/position/ShiftPositionsForm";
import { IReqShiftPositionItem } from "src/components/types";
import { fetcherGet, fetcherTrigger } from "src/utils/fetcher";

export const ShiftPositionsUpdate = () => {
  // state
  // --------------------
  const [isMounted, setIsMounted] = useState(false);

  // fetching, mutation, and revalidation
  // --------------------
  const router = useRouter();
  const { positionId } = router.query;
  const { data: dataDefaults, error: errorDefaults } = useSWR(
    isMounted ? "/api/shifts/positions/defaults" : null,
    fetcherGet
  );
  const { data: dataCurrent, error: errorCurrent } = useSWR(
    isMounted ? `/api/shifts/positions/${positionId}` : null,
    fetcherGet
  );
  const { isMutating, trigger } = useSWRMutation(
    `/api/shifts/positions/${positionId}`,
    fetcherTrigger
  );

  // other hooks
  // --------------------
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
    mode: "onBlur",
  });
  const { enqueueSnackbar } = useSnackbar();

  // side effects
  // --------------------
  useEffect(() => {
    if (router.isReady) {
      setIsMounted(true);
    }
  }, [router.isReady]);
  useEffect(() => {
    if (dataCurrent) {
      const {
        critical,
        details,
        endTimeOffset,
        id,
        lead,
        name,
        prerequisite: { name: prerequisiteName },
        role: { name: roleName },
        startTimeOffset,
      } = dataCurrent;

      reset({
        critical,
        details,
        endTimeOffset,
        id,
        lead,
        name,
        prerequisiteName,
        roleName,
        startTimeOffset,
      });
    }
  }, [dataCurrent, reset]);

  // logic
  // --------------------
  if (errorDefaults || errorCurrent) return <ErrorPage />;
  if (!dataDefaults || !dataCurrent) return <Loading />;

  // form submission
  // --------------------
  const onSubmit: SubmitHandler<IFormValues> = async (formValues) => {
    try {
      const [prerequisiteFound, roleFound] = findList(dataDefaults, formValues);

      if (prerequisiteFound === undefined || roleFound === undefined) {
        throw new TypeError("Prerequisite and/or role cannot be found.");
      }

      const reqBody: IReqShiftPositionItem = {
        critical: formValues.critical,
        details: formValues.details,
        endTimeOffset: formValues.endTimeOffset,
        id: formValues.id,
        lead: formValues.lead,
        name: formValues.name,
        prerequisite: prerequisiteFound,
        role: roleFound,
        startTimeOffset: formValues.startTimeOffset,
      };

      // update database
      await trigger({
        body: reqBody,
        method: "PATCH",
      });
      enqueueSnackbar(
        <SnackbarText>
          <strong>
            <strong>{formValues.name}</strong>
          </strong>{" "}
          shift position has been updated
        </SnackbarText>,
        {
          variant: "success",
        }
      );
      // route to positions page
      router.push("/shifts/positions");
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

  // render
  // --------------------
  return (
    <>
      <Hero
        Image={
          <Image
            alt="volunteers riding the census art car"
            fill
            priority
            src="/volunteers/account/create/hero.jpg"
            style={{
              objectFit: "cover",
            }}
          />
        }
        text="Update shift position"
      />
      <Container component="main">
        <Box component="section">
          <Breadcrumbs>
            <Link href="/shifts/positions">
              <Typography
                sx={{
                  alignItems: "center",
                  display: "flex",
                }}
              >
                <DateRangeIcon sx={{ mr: 0.5 }} />
                Shift positions
              </Typography>
            </Link>
            <Typography
              sx={{
                alignItems: "center",
                display: "flex",
              }}
            >
              <EditCalendarIcon sx={{ mr: 0.5 }} />
              Update position
            </Typography>
          </Breadcrumbs>
        </Box>
        <Box component="section">
          <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <ShiftPositionsForm
              control={control}
              dataDefaults={dataDefaults}
              errors={errors}
              positionName={dataCurrent.name}
            />

            {/* actions */}
            <Card>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  p: 2,
                }}
              >
                <Button
                  disabled={isMutating}
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    router.push("/shifts/positions");
                  }}
                  type="button"
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  disabled={Object.keys(errors).length > 0 || isMutating}
                  startIcon={
                    isMutating ? (
                      <CircularProgress size="1rem" />
                    ) : (
                      <EditCalendarIcon />
                    )
                  }
                  type="submit"
                  variant="contained"
                >
                  Update position
                </Button>
              </CardActions>
            </Card>
          </form>
        </Box>
      </Container>
    </>
  );
};
