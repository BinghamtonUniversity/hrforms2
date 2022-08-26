import React, { useState, useCallback } from "react";
import { Row, Col, Form, Alert } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AppButton } from "../components";
import { useAppQueries } from "../../queries";

const name = 'employment.position';

export default function EmploymentPosition() {
    const { control } = useFormContext();
    const watchLineNumber = useWatch({name:`${name}.lineNumber`,control});
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Position Details</Col>
            </Row>
            <EmploymentPositionSearch/>
            {watchLineNumber && 
                <>
                    <EmploymentPositionInfoBox/>
                    <EmploymentAppointmentInformation/>
                </>
            }
        </article>
    );
}

function EmploymentPositionSearch() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    const handleSearch = () => {
        console.log('do search');
    }
    const handleClear = () => {
        setValue(`${name}.lineNumber`,'');
    }
    const handleKeyDown = e => e.key=='Enter' && handleSearch(e);
    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">Position Search</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Line Number:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.lineNumber`}
                        control={control}
                        render={({field})=><Form.Control {...field} type="search" onKeyDown={handleKeyDown}/>}
                    />
                </Col>
            </Form.Group>
            <Row>
                <Col className="button-group">
                    <AppButton format="search" className="mr-1" onClick={handleSearch}>Search</AppButton>
                    <AppButton format="clear" className="mr-1" onClick={handleClear}>Clear</AppButton>
                </Col>
            </Row>
        </section>
    );
}

function EmploymentPositionInfoBox() {
    return (
        <Alert variant="secondary" className="mt-3">
            <p>Appointment Info here...</p>
        </Alert>
    );
}

function EmploymentAppointmentInformation() {
    const { control, getValues, setValue, clearErrors, trigger, formState: { errors } } = useFormContext();
    return (
        <section className="mt-3">
            <Row as="header">
                <Col as="h4">Apointment Information</Col>
            </Row>
        </section>
    );
}