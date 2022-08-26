import React, { useState, useCallback } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppButton } from "../components";
import { useAppQueries } from "../../queries";

export default function EmploymentAppointment() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Apopintment Details</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Campus Title:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="employment.appointment.campusTitle"
                        control={control}
                        render={({field})=><Form.Control {...field} type="text"/>}
                    />
                </Col>
            </Form.Group>
        </article>
    );
}