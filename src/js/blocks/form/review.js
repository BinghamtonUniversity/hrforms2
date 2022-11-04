import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { Icon } from "@iconify/react";
import { DateFormat } from "../components";

export default function Review() {
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Review</Col>
            </Row>
            <ReviewFormInformation/>
        </article>
    );
}

function ReviewFormInformation() {
    const { getValues, isNew } = useFormContext(); //TODO:change isNew to isDraft
    const formValues = getValues();
    return (
        <section>
            <Row as="header">
                <Col as="h4">Form Information</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" md={2} className="mb-0">Form ID:</Col>
                <Col as="dd" md={10} className="mb-0">{formValues.formId} {isNew && <span className="text-warning">[<Icon className="iconify-inline" icon="mdi:alert"/>not saved]</span>}</Col>
                <Col as="dt" md={2} className="mb-0">Form Type:</Col>
                <Col as="dd" md={10} className="mb-0">type</Col>
                <Col as="dt" md={2} className="mb-0">Payroll:</Col>
                <Col as="dd" md={10} className="mb-0">{formValues.payroll.title}</Col>
                <Col as="dt" md={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" md={10} className="mb-0"><DateFormat>{formValues.effDate}</DateFormat></Col>
            </Row>
        </section>
    );
}