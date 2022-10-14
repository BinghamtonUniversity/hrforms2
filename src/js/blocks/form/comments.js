import React, { useMemo } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";

export default function Comments() {
    const { control } = useFormContext();
    return (
        <article>
            <section className="mt-3">
                <Row as="header">
                    <Col as="h3">Comment</Col>
                </Row>
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Comment:</Form.Label>
                    <Col md={9}>
                        <Controller
                            name="comment"
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} as="textarea" rows={5}/>}
                        />
                    </Col>
                </Form.Group>
            </section>
            <CommentHistory/>
        </article>
    );
}

function CommentHistory() {
    return (
        <section>
            <Row as="header">
                <Col as="h3">Comment History</Col>
            </Row>
        </section>
    );
}