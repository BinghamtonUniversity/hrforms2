import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller } from "react-hook-form";
import { SettingsContext } from "../../../app";

export default function SettingsRequests() {
    const {control} = useFormContext();
    const toggleEnable = field => {
        console.log(field);
    }
    return (
        <SettingsContext.Consumer>
            {({requests}) => (
                <>
                    {Object.keys(requests).map(k=>(
                        <Form.Group key={k} as={Row} controlId={k}>
                            <Form.Label column md={2}>{k}:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`requests.${k}.title`}
                                    control={control}
                                    defaultValue={requests[k].title}
                                    render={({field}) => <Form.Control {...field} type="text" placeholder="Enter Title" />}
                                />
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`requests.${k}.showOnHome`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Home" checked={field.value}/>}
                                />
                            </Col>
                            <Col xs="auto">
                                <Controller
                                    name={`requests.${k}.showOnMenu`}
                                    control={control}
                                    render={({field}) => <Form.Check {...field} type="checkbox" inline label="Show On Menu" checked={field.value}/>}
                                />
                            </Col>
                            {requests[k].enabled && 
                                <Col xs="auto">
                                    <Controller
                                        name={`requests.${k}.enabled`}
                                        control={control}
                                        render={({field}) => <Form.Check {...field} type="checkbox" inline label="Enabled" checked={field.value} onChange={toggleEnable(field)}/>}
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

//title: input
//showOnHome: checkbox
//showOnMenu: checkbox
//enabled: checkbox