import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { CirclePicker } from "react-color";

import { COLOR_BURNING_MAN_BROWN, COLOR_CENSUS_PINK } from "src/constants";

export const Doodle = () => {
  // state
  // --------------------
  const [color, setColor] = useState(COLOR_BURNING_MAN_BROWN);
  const [pointerDown, setPointerDown] = useState(false);

  // side effects
  // --------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (canvas && container) {
      canvas.height = container.offsetHeight - 7; // remove vertical scrollbar
      canvas.width = container.offsetWidth;
      canvas.style.background = "#fff";
      canvas.style.borderRadius = "4px";
    }
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext("2d");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getPointerPositionOnCanvas = (event: any) => {
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      const { offsetLeft, offsetTop } = event.target;
      const canvasX = clientX - offsetLeft;
      const canvasY = clientY - offsetTop;

      return { x: canvasX, y: canvasY };
    };
    const handleDrawStart = (event: MouseEvent | TouchEvent) => {
      if (canvasContext) {
        event.preventDefault();

        canvasContext.lineCap = "round";
        canvasContext.lineJoin = "round";
        canvasContext.lineWidth = 10;
        canvasContext.strokeStyle = color;
        canvasContext.beginPath();

        setPointerDown(true);
      }
    };
    const handleDrawMove = (event: MouseEvent | TouchEvent) => {
      if (canvasContext) {
        event.preventDefault();

        if (pointerDown) {
          const pointerPos = getPointerPositionOnCanvas(event);

          canvasContext.lineTo(pointerPos.x, pointerPos.y);
          canvasContext.stroke();
        }
      }
    };
    const handleDrawEnd = (event: MouseEvent | TouchEvent) => {
      if (canvasContext) {
        event.preventDefault();

        setPointerDown(false);
      }
    };

    // add event listeners
    if (canvas) {
      canvas.addEventListener("mousedown", handleDrawStart);
      canvas.addEventListener("mousemove", handleDrawMove);
      canvas.addEventListener("mouseup", handleDrawEnd);
      canvas.addEventListener("mouseout", handleDrawEnd);
      canvas.addEventListener("touchstart", handleDrawStart);
      canvas.addEventListener("touchmove", handleDrawMove);
      canvas.addEventListener("touchend", handleDrawEnd);
    }

    // clean up event listeners
    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", handleDrawStart);
        canvas.removeEventListener("mousemove", handleDrawMove);
        canvas.removeEventListener("mouseup", handleDrawEnd);
        canvas.removeEventListener("mouseout", handleDrawEnd);
        canvas.removeEventListener("touchstart", handleDrawStart);
        canvas.removeEventListener("touchmove", handleDrawMove);
        canvas.removeEventListener("touchend", handleDrawEnd);
      }
    };
  }, [color, pointerDown]);

  // logic
  // --------------------
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext("2d");

    if (canvas && canvasContext) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // render
  // --------------------
  const colorList = [
    COLOR_BURNING_MAN_BROWN,
    COLOR_CENSUS_PINK,
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];

  return (
    <Container
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        mt: 3,
      }}
    >
      <Box
        component="section"
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Box ref={containerRef} sx={{ flex: 1, mb: 1 }}>
          <canvas ref={canvasRef} />
        </Box>
        <Card>
          <CardContent>
            <Stack
              alignItems="flex-end"
              direction="row"
              justifyContent="space-between"
            >
              <CirclePicker
                color={color}
                colors={colorList}
                onChangeComplete={(event) => setColor(event.hex)}
                width="420px"
              />
              <Button
                onClick={clearCanvas}
                type="button"
                startIcon={<DeleteIcon />}
                variant="contained"
              >
                Clear
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
