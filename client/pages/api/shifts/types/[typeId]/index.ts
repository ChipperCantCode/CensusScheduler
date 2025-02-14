import { RowDataPacket } from "mysql2";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  IReqShiftTypeItem,
  IResShiftTypeCurrent,
  IResShiftTypeInformation,
  IResShiftTypePositionItem,
  IResShiftTypeTimeItem,
} from "@/components/types/shifts/types";
import { generateId } from "@/utils/generateId";
import { pool } from "lib/database";

const shiftTypeUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { typeId } = req.query;

  switch (req.method) {
    // get
    // --------------------
    case "GET": {
      // get current information
      const [dbInformationList] = await pool.query<RowDataPacket[]>(
        `SELECT
          sc.shift_category,
          sn.core,
          sn.off_playa,
          sn.shift_details,
          sn.shift_name
        FROM op_shift_name AS sn
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=sn.shift_category_id
        WHERE sn.shift_name_id=?`,
        [typeId]
      );
      const [resInformation] = dbInformationList.map(
        ({
          core,
          off_playa,
          shift_category,
          shift_details,
          shift_name,
        }: RowDataPacket) => {
          const information: IResShiftTypeInformation = {
            category: { name: shift_category ?? "" },
            details: shift_details,
            isCore: Boolean(core),
            isOffPlaya: Boolean(off_playa),
            name: shift_name,
          };

          return information;
        }
      );
      // get all current positions
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT
          pt.critical,
          pt.end_time_offset,
          pt.lead,
          pt.position_details,
          pt.position_type_id,
          pt.position,
          pt.start_time_offset,
          r.role,
          sc.shift_category,
          sp.total_slots,
          sp.wap_points
        FROM op_shift_position AS sp
        LEFT JOIN op_position_type AS pt
        ON pt.position_type_id=sp.position_type_id
        LEFT JOIN op_roles AS r
        ON r.role_id=pt.role_id
        LEFT JOIN op_shift_category AS sc
        ON sc.shift_category_id=pt.prerequisite_id
        WHERE sp.shift_name_id=?
        AND sp.remove_shift_position=false
        ORDER BY pt.position`,
        [typeId]
      );
      const resPositionList = dbPositionList.map(
        ({
          critical,
          end_time_offset,
          lead,
          position,
          position_details,
          position_type_id,
          role,
          shift_category, // of prerequisite
          start_time_offset,
          total_slots,
          wap_points,
        }) => {
          const resPositionItem: IResShiftTypePositionItem = {
            critical: Boolean(critical),
            details: position_details,
            endTimeOffset: end_time_offset,
            lead: Boolean(lead),
            name: position,
            positionId: position_type_id,
            prerequisite: shift_category ?? "",
            role: role ?? "",
            startTimeOffset: start_time_offset,
            totalSlots: total_slots,
            wapPoints: wap_points,
          };

          return resPositionItem;
        }
      );
      // get all current times
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT
          end_time_lt,
          notes,
          shift_instance,
          shift_times_id,
          start_time_lt
        FROM op_shift_times
        WHERE shift_name_id=?
        AND remove_shift_time=false
        ORDER BY start_time_lt`,
        [typeId]
      );
      const resTimeList = dbTimeList.map(
        ({
          end_time_lt,
          notes,
          shift_instance,
          shift_times_id,
          start_time_lt,
        }) => {
          const resTimeItem: IResShiftTypeTimeItem = {
            endTime: end_time_lt,
            instance: shift_instance,
            notes: notes ?? "",
            startTime: start_time_lt,
            timeId: shift_times_id,
          };

          return resTimeItem;
        }
      );

      const resShiftTypeCurrent: IResShiftTypeCurrent = {
        information: resInformation,
        positionList: resPositionList,
        timeList: resTimeList,
      };

      return res.status(200).json(resShiftTypeCurrent);
    }

    // patch
    // --------------------
    case "PATCH": {
      // update type
      const {
        information: {
          category: { id: categoryId },
          details,
          isCore,
          isOffPlaya,
          name,
        },
        positionList,
        timeList,
      }: IReqShiftTypeItem = JSON.parse(req.body);

      // update information row
      await pool.query(
        `UPDATE op_shift_name
        SET
          core=?,
          update_shift=true,
          off_playa=?,
          shift_category_id=?,
          shift_details=?,
          shift_name=?
        WHERE shift_name_id=?`,
        [isCore, isOffPlaya, categoryId, details, name, typeId]
      );

      // update position rows
      const [dbPositionList] = await pool.query<RowDataPacket[]>(
        `SELECT position_type_id
        FROM op_shift_position
        WHERE shift_name_id=?`,
        [typeId]
      );
      const positionListUpdate = positionList.filter(({ positionId }) => {
        return dbPositionList.some(
          ({ position_type_id }) => position_type_id === positionId
        );
      });
      const positionListAdd = positionList.filter(({ positionId }) => {
        return !dbPositionList.some(
          ({ position_type_id }) => position_type_id === positionId
        );
      });
      const positionListRemove = dbPositionList.filter(
        ({ position_type_id }) => {
          return !positionList.some(
            ({ positionId }) => positionId === position_type_id
          );
        }
      );

      positionListUpdate.forEach(
        async ({ positionId, totalSlots, wapPoints }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_position
            SET
              total_slots=?,
              update_shift_position=true,
              remove_shift_position=false,
              wap_points=?
            WHERE position_type_id=?
            AND shift_name_id=?`,
            [totalSlots, wapPoints, positionId, typeId]
          );
        }
      );
      positionListAdd.forEach(async ({ positionId, totalSlots, wapPoints }) => {
        const shiftPositionIdNew = generateId(
          `SELECT shift_position_id
          FROM op_shift_position
          WHERE shift_position_id=?`
        );

        await pool.query(
          `INSERT INTO op_shift_position (
            add_shift_position,
            position_type_id,
            shift_name_id,
            shift_position_id,
            total_slots,
            wap_points
          )
          VALUES (true, ?, ?, ?, ?, ?)`,
          [positionId, typeId, shiftPositionIdNew, totalSlots, wapPoints]
        );
      });
      positionListRemove.forEach(async ({ position_type_id: positionId }) => {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_shift_position
          SET remove_shift_position=true
          WHERE shift_name_id=?
          AND position_type_id=?`,
          [typeId, positionId]
        );
      });

      // update time rows
      const [dbTimeList] = await pool.query<RowDataPacket[]>(
        `SELECT shift_times_id
        FROM op_shift_times
        WHERE shift_name_id=?`,
        [typeId]
      );
      const timeListUpdate = timeList.filter(({ timeId }) => {
        return dbTimeList.some(
          ({ shift_times_id }) => shift_times_id === timeId
        );
      });
      const timeListAdd = timeList.filter(({ timeId }) => {
        return !dbTimeList.some(
          ({ shift_times_id }) => shift_times_id === timeId
        );
      });
      const timeListRemove = dbTimeList.filter(({ shift_times_id }) => {
        return !timeList.some(({ timeId }) => timeId === shift_times_id);
      });

      timeListUpdate.forEach(
        async ({ endTime, timeId, instance, notes, startTime }) => {
          await pool.query<RowDataPacket[]>(
            `UPDATE op_shift_times
            SET
              end_time_lt=?,
              notes=?,
              update_shift_time=true,
              shift_instance=?,
              start_time_lt=?
            WHERE shift_times_id=?`,
            [endTime, notes, instance, startTime, timeId]
          );
        }
      );
      timeListAdd.forEach(async ({ endTime, instance, notes, startTime }) => {
        const idNew = generateId(
          `SELECT shift_times_id
            FROM op_shift_times
            WHERE shift_times_id=?`
        );
        await pool.query(
          `INSERT INTO op_shift_times (
              add_shift_time,
              end_time_lt,
              notes,
              shift_instance,
              shift_name_id,
              shift_times_id,
              start_time_lt
            )
            VALUES (true, ?, ?, ?, ?, ?, ?)`,
          [endTime, notes, instance, typeId, idNew, startTime]
        );
      });
      timeListRemove.forEach(async ({ shift_times_id }) => {
        await pool.query<RowDataPacket[]>(
          `UPDATE op_shift_times
          SET remove_shift_time=true
          WHERE shift_times_id=?`,
          [shift_times_id]
        );
      });

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // delete
    // --------------------
    case "DELETE": {
      // delete type
      await pool.query<RowDataPacket[]>(
        `UPDATE op_shift_name
        SET delete_shift=true
        WHERE shift_name_id=?`,
        [typeId]
      );

      return res.status(200).json({
        statusCode: 200,
        message: "OK",
      });
    }

    // default
    // --------------------
    // send error message
    default: {
      return res.status(404).json({
        statusCode: 404,
        message: "Not found",
      });
    }
  }
};

export default shiftTypeUpdate;
