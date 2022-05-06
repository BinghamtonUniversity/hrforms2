import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Row, Col, Form, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { AppButton } from "../components";

export default function FormBasicInfo() {
    const {control,isDraft,setValue,formState:{errors}} = useFormContext();
    const resetLookup = () => {
        ['lookupType','lookupBNumber','lookupLastName','lookupDOB'].forEach(f=>setValue(f,''));
    }
    return (
        <article className="mt-3 px-2">
            <Row as="header">
                <Col as="h4">Person Lookup</Col>
            </Row>
            <Form.Group as={Row}>
                <Col sm={2}>
                    <Controller
                        name="lookupType"
                        control={control}
                        render={({field})=><Form.Check {...field} type="radio" value="bNumber" label="B-Number:"/>}
                    />
                </Col>
                <Col xs="auto">
                    <Controller
                        name="lookupBNumber"
                        defaultValue=""
                        control={control}
                        render={({field})=><Form.Control {...field} type="text"/>}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Col sm={2}>
                <Controller
                        name="lookupType"
                        control={control}
                        render={({field})=><Form.Check {...field} type="radio" value="lastName" label="Last Name:"/>}
                    />
                </Col>
                <Col xs="auto">
                    <Controller
                        name="lookupLastName"
                        defaultValue=""
                        control={control}
                        render={({field})=><Form.Control {...field} type="text"/>}
                    />
                </Col>
                <Form.Label column xs="auto">Date of Birth:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="lookupDOB"
                        defaultValue=""
                        control={control}
                        render={({field})=><Form.Control {...field} as={DatePicker} selected={field.value}/>}
                    />
                </Col>
            </Form.Group>
            <Row as="footer">
            <Col className="button-group">
                    <AppButton format="search">Search</AppButton>
                    <AppButton format="clear" onClick={resetLookup}>Clear</AppButton>
                </Col>
            </Row>
        </article>
    );
}

function LookupResultTable() {
    return (
        <p>lookup result table</p>
    );
}