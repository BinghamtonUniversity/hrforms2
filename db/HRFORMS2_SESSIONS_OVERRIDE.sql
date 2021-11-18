--------------------------------------------------------
--  File created - Friday-April-02-2021   
--------------------------------------------------------
--------------------------------------------------------
--  DDL for Table HRFORMS2_SESSION_OVERRIDE
--------------------------------------------------------

  CREATE TABLE "HRFORMS2_SESSION_OVERRIDE" 
   (	"SESSION_ID" VARCHAR2(32 BYTE), 
	"CAS_SESSION_ID" VARCHAR2(70 BYTE), 
	"SUNY_ID" NUMBER(10,0), 
	"OVERRIDE_BY" NUMBER(10,0), 
	"START_OVERRIDE" NUMBER(10,0), 
	"END_OVERRIDE" NUMBER(10,0)
   ) ;
--------------------------------------------------------
--  Constraints for Table HRFORMS2_SESSION_OVERRIDE
--------------------------------------------------------

  ALTER TABLE "HRFORMS2_SESSION_OVERRIDE" MODIFY ("START_OVERRIDE" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSION_OVERRIDE" MODIFY ("OVERRIDE_BY" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSION_OVERRIDE" MODIFY ("SUNY_ID" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSION_OVERRIDE" MODIFY ("CAS_SESSION_ID" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSION_OVERRIDE" MODIFY ("SESSION_ID" NOT NULL ENABLE);
