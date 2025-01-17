import React from "react";
import { useFormContext } from "react-hook-form";
import { Row, Col } from "react-bootstrap";
import { DateFormat } from "../../components";

export default function ReviewEmploymentSeparation() {
    const { getValues } = useFormContext();
    const [effDate,lastDate] = getValues(['effDate','employment.separation.lastDateWorked']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Separation</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={3} md={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{effDate}</DateFormat></Col>
                <Col as="dt" sm={3} md={2} className="mb-0">Last Date Worked:</Col>
                <Col as="dd" sm={9} md={4} className="mb-0"><DateFormat>{lastDate}</DateFormat></Col>
            </Row>
        </article>
    );
}