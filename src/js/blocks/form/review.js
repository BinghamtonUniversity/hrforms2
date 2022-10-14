import React, { useMemo } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";

export default function Comments() {
    const { control, getValues, formState:{ errors }} = useFormContext();
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Review</Col>
            </Row>
        </article>
    );
}
