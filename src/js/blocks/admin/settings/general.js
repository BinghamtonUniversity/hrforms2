import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller } from "react-hook-form";

export default function SettingsGeneral() {
    const {control,formState:{errors}} = useFormContext();
    return (
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Draft Limit:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.draftLimit"
                        control={control}
                        defaultValue={10}
                        rules={{
                            min:{value:0,message:'Limit cannot be less than 0'},
                            max:{value:100,message:'Limit cannot be greater than 100'}
                        }}
                        render={({field}) => (
                            <>
                                <Form.Control {...field} type="number" isInvalid={errors?.general?.draftLimit}/>
                                <Form.Text id="draftLimitHelp" muted>Maximum number of drafts a user may have (0 = No Limit)</Form.Text>
                            </>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors?.general?.draftLimit?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Show Request Workflow:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.showReqWF"
                        control={control}
                        defaultValue="a"
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='y' checked={field.value=='y'}/>
                                <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='a' checked={field.value=='a'}/>
                                <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='n' checked={field.value=='n'}/>
                                <Form.Text id="showReqWFHelp" muted>Toggle display of workflow on Requests lists</Form.Text>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Show Form Workflow:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.showFormWF"
                        control={control}
                        defaultValue="a"
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="radio" id="showSkipped-all" label="All" value='y' checked={field.value=='y'}/>
                                <Form.Check {...field} inline type="radio" id="showSkipped-admin" label="Admin Only" value='a' checked={field.value=='a'}/>
                                <Form.Check {...field} inline type="radio" id="showSkipped-none" label="None" value='n' checked={field.value=='n'}/>
                                <Form.Text id="showFormWFHelp" muted>Toggle display of workflow on Forms lists</Form.Text>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Show Skipped:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.showSkipped"
                        control={control}
                        defaultValue="n"
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
        </>
    );
}
