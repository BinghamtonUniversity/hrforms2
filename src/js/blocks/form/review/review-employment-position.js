import React, { useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { DateFormat } from "../../components";
import { NewLine } from "../review";

export default function ReviewEmploymentPosition() {
    const { getValues } = useFormContext();
    const [position,payroll] = getValues(['employment.position','payroll']);
    return (
        <article className="border border-dark rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Position</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} md={2} className="mb-0">Type:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{position.APPOINTMENT_TYPE.label}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Percent:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{position.APPOINTMENT_PERCENT}</Col>
                {payroll?.ADDITIONAL_INFO?.hasBenefits &&
                    <>
                        <Col as="dt" sm={3} md={2} className="mb-0">Benefits:</Col>
                        <Col as="dd" sm={9} md={4} className="mb-0">{position.BENEFIT_FLAG.label}</Col>
                    </>
                }
                {/* REMOVED: 3/27/2025 per discussion with HR
                <Col as="dt" sm={3} md={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{position.apptEffDate}</DateFormat></Col>
                */}
                <Col as="dt" sm={3} md={2} className="mb-0">End Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{position.apptEndDate}</DateFormat></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Vol Reduction:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{(position.VOLUNTARY_REDUCTION=="Y")?"Yes":"No"}</Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Check Sort Code:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0">{position.PAYROLL_MAIL_DROP_ID.label}</Col>
                <NewLine/>
                <Col as="dt" sm={3} md={2} className="mb-0">Justification:</Col>
                <Col as="dd" sm={9} md={10} className="mb-0">{position.justification.label}</Col>
            </Row>
        </article>
    );
}