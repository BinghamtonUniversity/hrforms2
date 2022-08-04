import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Row, Col, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";

export default function PersonDemographics() {
    const { control } = useFormContext();
    return (
        <article className="mt-3">
            <Row as="header">
                <Col as="h3">Demographics</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Date of Birth:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="person.demographics.DOB"
                        control={control}
                        render={({field}) => <Form.Control 
                            as={DatePicker} 
                            name={field.name}
                            selected={field.value} 
                            closeOnScroll={true} 
                            onChange={field.onChange} 
                        />}
                    />
                </Col>
            </Form.Group>
        </article>
    );
}