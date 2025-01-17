import React from "react";
import { useFormContext } from "react-hook-form";
import { Row, Col } from "react-bootstrap";
import { CurrencyFormat, DateFormat } from "../../components";
import { conditionalFields, useHRFormContext } from "../../../config/form";

export default function ReviewEmploymentLeave() {
    const { getValues } = useFormContext();
    const { formType } = useHRFormContext();
    const [info] = getValues(['employment.leave']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Leave</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} md={2} className="mb-0">Original Salary:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><CurrencyFormat>{info.origSalary}</CurrencyFormat></Col>
                {conditionalFields.partialLeave.includes(formType) && 
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Leave Percent:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{info.leavePercent}%</Col>
                        <Col as="dt" sm={3} md={2} className="mb-0">Leave Salary:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0"><CurrencyFormat>{info.leaveSalary}</CurrencyFormat></Col>
                    </>
                }
                <Col as="dt" sm={3} md={2} className="mb-0">Leave End Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{info.leaveEndDate}</DateFormat></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Justification:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{info.justification.label}</Col>
            </Row>
        </article>
    );
}