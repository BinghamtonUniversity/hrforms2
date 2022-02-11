import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";

export default function Comments() {
    const {control,formState:{errors}} = useFormContext();
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Comment:</Form.Label>
                <Col md={9}>
                    <Controller
                        name="comment"
                        defaultValue=""
                        rules={{required:{value:true,message:'Comment is required'}}}
                        control={control}
                        render={({field}) => <Form.Control {...field} as="textarea" placeholder="Enter a brief comment" rows={5} isInvalid={errors.comment}/>}
                    />
                    <Form.Control.Feedback type="invalid">{errors.comment?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <CommentsHistory/>
        </>
    );
}

function CommentsHistory() {
    return (
        <p>comments history; get comments data if not draft</p>
    );
}