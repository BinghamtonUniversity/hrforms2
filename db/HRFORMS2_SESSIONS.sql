--------------------------------------------------------
--  File created - Friday-April-02-2021   
--------------------------------------------------------
--------------------------------------------------------
--  DDL for Table HRFORMS2_SESSIONS
--------------------------------------------------------

  CREATE TABLE "HRFORMS2_SESSIONS" 
   (	"SESSION_ID" RAW(20), 
	"CAS_SESSION_ID" VARCHAR2(70 BYTE), 
	"USER_ID" VARCHAR2(20 BYTE), 
	"BNUMBER" VARCHAR2(9 BYTE), 
	"SUNY_ID" NUMBER(10,0), 
	"IP_ADDRESS" VARCHAR2(16 BYTE), 
	"LOGIN_DATE" NUMBER(10,0), 
	"USER_AGENT" VARCHAR2(250 BYTE)
   ) ;
--------------------------------------------------------
--  DDL for Index HRFORMS2_SESSIONS_INDEX1
--------------------------------------------------------

  CREATE INDEX "HRFORMS2_SESSIONS_INDEX1" ON "HRFORMS2_SESSIONS" ("SESSION_ID", "CAS_SESSION_ID") 
  ;
--------------------------------------------------------
--  Constraints for Table HRFORMS2_SESSIONS
--------------------------------------------------------

  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("LOGIN_DATE" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("IP_ADDRESS" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("SUNY_ID" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("BNUMBER" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("USER_ID" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("CAS_SESSION_ID" NOT NULL ENABLE);
  ALTER TABLE "HRFORMS2_SESSIONS" MODIFY ("SESSION_ID" NOT NULL ENABLE);
