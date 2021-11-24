import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller } from "react-hook-form";

export default function Comments({control}) {
    return (
        <>
            <Row>
                <Col><h3>Comments</h3></Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Comment:</Form.Label>
                <Col md={9}>
                    <Controller
                        name="comment"
                        control={control}
                        render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief comment" rows={5}/>}
                    />
                </Col>
            </Form.Group>
            <CommentsHistory/>
        </>
    );
}

function CommentsHistory() {
    return (
        <p>comments history...only show if there is an id; no id means new and no history</p>
    );
}