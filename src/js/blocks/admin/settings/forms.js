import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller } from "react-hook-form";
import { SettingsContext } from "../../../app";

export default function SettingsRequests() {
    const {control} = useFormContext();
    return (
        <SettingsContext.Consumer>
            {({forms}) => (
                <>
                    {Object.keys(forms.menu).map(k=>(
                        <Form.Group key={k} as={Row} controlId={k}>
                            <Form.Label column md={2}>{k}:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`forms.menu.${k}.title`}
                                    control={control}
                                    defaultValue={forms.menu[k].title}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Title" />}
                                />
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`forms.menu.${k}.showOnHome`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Home" checked={field.value}/>}
                                />
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`forms.menu.${k}.showOnMenu`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Menu" checked={field.value}/>}
                                />
                            </Col>
                            {forms.menu[k].enabled && 
                                <Col xs="auto">
                                    <Controller
                                        name={`forms.menu.${k}.enabled`}
                                        control={control}
                                        render={({field}) => <Form.Check {...field} type="checkbox" inline label="Enabled" checked={field.value}/>}
                                    />
                                </Col>
                            }
                        </Form.Group>
                    ))}
                </>
            )}
        </SettingsContext.Consumer>
    );
}
