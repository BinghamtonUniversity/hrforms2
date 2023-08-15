import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import { useFormContext, Controller, useWatch } from "react-hook-form";

export default function SettingsGeneral() {
    const { control, formState:{ errors }} = useFormContext();
    const watchHideNews = useWatch({name:'general.hideNews'});
    return (
        <section>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Allow Hide News:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.hideNews"
                        control={control}
                        defaultValue="Y"
                        render={({field}) => (
                            <>
                                <Form.Check {...field} inline type="checkbox" checked={field.value} onChange={e=>field.onChange(e.target.checked)}/>
                                <Form.Text id="hideNewsHelp" muted>Allow users to hide news on home page.  Updating news content will show news again.</Form.Text>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Hide News Expire:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.hideNewsExpire"
                        control={control}
                        defaultValue={24}
                        render={({field}) => (
                            <>
                                <Form.Control {...field} type="number" disabled={!watchHideNews}/>
                                <Form.Text id="hideNewsExpireHelp" muted>Amount of time (in hours) before the news will be displayed to the user after hiding (0 = no expiration)</Form.Text>
                            </>
                        )}
                    />
                </Col>
            </Form.Group>
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
                <Form.Label column md={2}>User Refresh:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="general.userRefresh"
                        control={control}
                        defaultValue={7}
                        rules={{
                            min:{value:1,message:'User Refresh must be greater than 0'},
                            required: 'User Refresh cannot be empty'
                        }}
                        render={({field}) => (
                            <>
                                <Form.Control {...field} type="number" isInvalid={errors?.general?.userRefresh}/>
                                <Form.Text id="userRefreshHelp" muted>Minimum time (in days) before user information may be refreshed from SUNY HR data.</Form.Text>
                            </>
                        )}
                    />
                    <Form.Control.Feedback type="invalid">{errors?.general?.userRefresh?.message}</Form.Control.Feedback>
                </Col>
            </Form.Group>
        </section>
    );
}