import React from "react";
import { Row, Col } from "react-bootstrap";
import { useHRFormContext } from "../../../config/form";

export default function ReviewSubmitterInfo() {
    const { isDraft, createdBy } = useHRFormContext();
    if (isDraft) return null;
    return (
        <section className="mb-4">
            <Row as="header">
                <Col>
                    <h4 className="border-bottom border-main">Submitter Information</h4>
                </Col>
            </Row>
            {createdBy && 
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={3} md={2} className="mb-0">SUNY ID:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.SUNY_ID}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Name:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.fullName}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Email:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.EMAIL_ADDRESS_WORK}</Col>
                    <Col as="dt" sm={3} md={2} className="mb-0">Department:</Col>
                    <Col as="dd" sm={9} md={10} className="mb-0">{createdBy.REPORTING_DEPARTMENT_NAME}</Col>
                </Row>
            }
        </section>
    );
}

