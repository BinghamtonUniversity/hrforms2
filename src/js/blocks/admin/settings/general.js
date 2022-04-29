import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller } from "react-hook-form";

export default function SettingsGeneral() {
    const {control} = useFormContext();
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Show Skipped:</Form.Label>
            <Col xs="auto">
                <Controller
                    name="general.showSkipped"
                    control={control}
                    render={({field}) => (
                        <>
                            <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='y' checked={field.value=='y'}/>
                            <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='a' checked={field.value=='a'}/>
                            <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='n' checked={field.value=='n'}/>
                            <Form.Text id="showSkippedHelp" muted>Toggle display of skipped hierarchy groups</Form.Text>
                        </>
                    )}
                />
            </Col>
        </Form.Group>
    );
}
