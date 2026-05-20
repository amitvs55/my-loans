//{{COMPONENT_IMPORT_STMTS
package advantage;
import java.util.Enumeration;
import java.util.Vector;
import versata.common.*;
import versata.common.vstrace.*;
import versata.vls.cache.*;
import versata.vls.*;
import java.util.*;
import java.text.*;
import java.math.*;
import com.amsinc.gems.adv.common.*;
import com.versata.util.logging.*;
import org.apache.commons.logging.*;

//END_COMPONENT_IMPORT_STMTS}}

import net.sf.json.JSONObject;
import net.sf.json.JSONArray;


/*
**  VCM_DOC_AD*/

//{{COMPONENT_RULES_CLASS_DECL
public class VCM_DOC_ADImpl extends  VCM_DOC_ADBaseImpl


//END_COMPONENT_RULES_CLASS_DECL}}
{
//{{COMP_CLASS_CTOR
public VCM_DOC_ADImpl (){
	super();
}

public VCM_DOC_ADImpl(Session session, boolean makeDefaults)
{
	super(session, makeDefaults);




//END_COMP_CLASS_CTOR}}

   }
   private R_ADImpl moAd = null;

   //MASS CUSTOM START --
   private boolean mboolSameNewAdId = false;
   private boolean mboolSameNewCntacId = false;

   private boolean mboolSameAdIdAsMstr = false;
   private boolean mboolSameCntacNoAsCntact = false;
   //MASS CUSTOM END --

   private static String[] EFT_FIELDS = {"EFT_STA", "ALW_EFT_FL", "ABA_NO",
         "ROUT_ID", "ACCT_TYP", "ACCT_NO", "PNOTE_REJ_CD", "EFT_FRMT",
         "REJ_HLD_REAS","ACCT_NO_VIEW", "PARITY_STR", "REMT_ADV_REQ_FL",
         "REMT_ADV_FRMT", "REMT_ADV_DISB_TYP","REMT_TRANS_MODE"};
   
   /**
    * Editable Fields need to prevent copy from the Reference Table
    */
   private static String[] AD_EDTBLE_FIELDS = {"DIV_DEPT" , "ADDL_AD_INFO" , 
           "DFLT_AD_TYP" , "MAIL_RET_FL" , "EFEND_DT" , "EFBGN_DT" , "ACT_AD_FL" , 
           "CNTAC_NO" , "ENG_SP_FL", "ACORSPD_TYP"};
   /* Constant to define all  Address fields */
	private static String[] fsHomeAddr = { "STR_1_NM", "STR_2_NM", "CITY_NM", "ST", "ZIP", "CTRY" };
	private static ADVAddressStandardizationHelper moAddrStdHelper;
	/* Variable to check if Melissa Address Validation is  enabled*/
	private String msMelissaEnabled = "";


//{{EVENT_CODE

//{{COMP_EVENT_beforeInsert
public void beforeInsert(DataObject obj, Response response)
{
   //If document action is validate/submit and Changes Rejected Flag on header
   //is true then return w/o doing any processing
   if( (getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_VALIDATE ||
      getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_SUBMIT) &&
      (getVmHdrVmAd() != null) && getVmHdrVmAd().getCHNG_REJCT_FL() )
   {
      return;
   }
   if ((getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_VALIDATE
		   || getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_SUBMIT)) {
	   checkAddrStandard();
   }

   commonBeforeLogic();
   if (AMSStringUtil.strEqual(getSession().getProperty(AMSCommonConstants.SESSION_OFFLINE_PROCESS),
          AMSCommonConstants.SESSION_DOC_YES) && getmoAd() != null) {
      setVER_CTRL_NO(getmoAd().getAMS_ROW_VERS_NO());
   }

}
//END_COMP_EVENT_beforeInsert}}

//{{COMP_EVENT_beforeUpdate
public void beforeUpdate(DataObject obj, Response response)
{

   if( (getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_VALIDATE) ||
      (getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_SUBMIT) )
   {
      //If document action is validate/submit and Changes Rejected Flag on header
      //is true then return w/o doing any processing
      if((getVmHdrVmAd() != null) && getVmHdrVmAd().getCHNG_REJCT_FL() )
      {
         return;
      }
      if( isNull("LN_ACTN") ) //raise severe exception and stop processing
      {
         raiseException("%c:A2920%");

      }
      else if( getLN_ACTN() == CVL_LN_ACTN2Impl.NEW )
      {
         moAd = R_ADImpl.getNewObject(getSession(),true);
      }
	  checkAddrStandard();
   }


   //Call commonBeforeLogic
   commonBeforeLogic();

}
//END_COMP_EVENT_beforeUpdate}}

//END_EVENT_CODE}}



   public void addListeners() {
//{{EVENT_ADD_LISTENERS

	addRuleEventListener(this);
//END_EVENT_ADD_LISTENERS}}
   }

//{{COMPONENT_RULES
	public static VCM_DOC_ADImpl getNewObject(Session session, boolean makeDefaults)
	{
		return new VCM_DOC_ADImpl(session, makeDefaults);
	}	

//END_COMPONENT_RULES}}

   public void myInitializations()
      {
          mboolMediateDocComponent = false;
   }



/**
  * Method to determine if same new AD_ID is being used on different VCM_DOC_AD components
  * with Line Action of 'New' and different address information.
  * @return void
  */
  public void isAddressSameNewAdId()
  {

     //Get a handle on the HashMap on Header that stores VCM_DOC_AD records. Check if
     //any of the existing VCM_DOC_AD records in the hashmap have same AD_ID. If not, then
     //add this record to the hashmap. If yes, then compare certain fields on this record
     //against the one in the haspmap and issue error if required.
     //Setting the mboolChildCascadeSorted on header will take care that the component
     //lines are processed in correct order.

      if( !AMSStringUtil.strIsEmpty(getAD_ID()) && (getLN_ACTN() == CVL_LN_ACTN2Impl.NEW) &&
                                        (getVmHdrVmAd() != null ) )
      {
         //If there already exists a AD component Record with same AD_ID
         //compare the following fields and if atleast one is different, issue error
         if( getVmHdrVmAd().moHmAd_AdId.containsKey(getAD_ID()) )
         {
            VCM_DOC_ADImpl loVcmAd = (VCM_DOC_ADImpl)getVmHdrVmAd().
                                          moHmAd_AdId.get(getAD_ID());


            if( VendorUtil.compareTo(this,loVcmAd,VendorUtil.AD_COMPARE,true) != 0 )
            {
               //MASS CUSTOM START --
               //Set the boolean mboolSameNewAdId to true
               mboolSameNewAdId = true;
               //MASS CUSTOM END


               raiseException("%c:A2927,v:("+getAD_ID()+") %");
            }
         }
         else //it is the first record with this AD_ID, so add it to the hashmap.
         {
            getVmHdrVmAd().moHmAd_AdId.put( getAD_ID(), this);
         }
      }

   }//end of isAddressSameNewAdId





/**
  * Method to determine if same new CNTAC_NO is being used on different VCM_DOC_AD components
  * with Line Action of 'New' and different address information.
  * @return void
  */
  public void isAddressSameAsNewCntacNo()
  {

     //Get a handle on the HashMap on Header that stores VCM_DOC_AD records. Check if
     //any of the existing VCM_DOC_AD records in the hashmap have same CNTAC_NO. If not,
     //then add this record to the hashmap. If yes, then compare certain fields on this
     //record against the one in the haspmap and issue error if required.
     //Setting the mboolChildCascadeSorted on header will take care that the component
     //lines are processed in correct order.

      if( !AMSStringUtil.strIsEmpty(getCNTAC_NO()) &&
         (getLN_ACTN() == CVL_LN_ACTN2Impl.NEW) &&
         (getVmHdrVmAd() != null ) )
      {

         //If there already exists a VCM_DOC_AD component Record with same CNTAC_NO
         //compare the following fields and if atleast one is different, issue error
         if( getVmHdrVmAd().moHmAd_CntacNo.containsKey(getCNTAC_NO()) )
         {
            VCM_DOC_ADImpl loVcmAd = (VCM_DOC_ADImpl)getVmHdrVmAd().
                                   moHmAd_CntacNo.get(getCNTAC_NO());

            if( VendorUtil.compareTo(this,loVcmAd,VendorUtil.PC_COMPARE,true) != 0 )
            {

               //MASS CUSTOM START --
               //Set the boolean mboolSameNewCntacId to true
               mboolSameNewCntacId = true;
               //MASS CUSTOM END

               raiseException("%c:A2948,v:"+getCNTAC_NO()+" %");
            }
         }
         else //it is the first record with this CNTAC_NO, so add it to the hashmap.
         {
            getVmHdrVmAd().moHmAd_CntacNo.put( getCNTAC_NO(), this);
         }
      }

   }//end of isAddressSameAsNewCntacNo



   /**
     * Method to load corresponding values from R_AD record
     * @return void
     */
      public void loadAddressValues()
      {
         //First make sure that the keys to R_AD are present
         //and (important) if this is a draft document. we do not want this info to be
         //changed on anything but a draft document
         if( (getDOC_PHASE_CD() == DOC_PHASE_DRAFT) &&
            (getLN_ACTN() != CVL_LN_ACTN2Impl.NEW) )
         {

               Vector lvExclude = new Vector();
               lvExclude.addElement("ACCT_NO");
               if( getmoAd() != null )
               {
                  this.copyCorresponding(getmoAd(), lvExclude, true);
                  setACCT_NO_VIEW(getmoAd().getACCT_NO_VIEW());
                  setVER_CTRL_NO(getmoAd().getAMS_ROW_VERS_NO());
               }
               else
               {
                  //Issue an error that a valid primary key info has not been entered.
                  raiseException("%c:A2932%");
               }
         }
      }//end of loadVcustValues()




   /**
     * Method to assign Sequence Number to AD_ID that is unique within a Headquarters account
     * @return void
     */
     private void assignADSeqNo()
     {
      // Get the R_VEND_CUST_CONFG record
      R_VEND_CUST_CONFGImpl loVendCustCnfg = R_VEND_CUST_CONFGImpl.getVendCustConfigRec(getSession());

      if (loVendCustCnfg == null)
      {
         // No record on the R_VEND_CUST_CONFG table, return;
         raiseException("%c:A3910%");
         return;
      }

      if (!AMSStringUtil.strIsEmpty(getN_AD_ID())
              && !AMSStringUtil.strIsEmpty(getPNT_ACCT_CD()))
        // Check to see if the Address ID is valid on the R_MSTR_AD table
        // If valid no error return as this is the existing Address.
        // This check is just done for baseline, as there might be existing
        // clients
        // with existing address code.
        {
           if (R_MSTR_ADImpl.getMstrAddress(getPNT_ACCT_CD(), getN_AD_ID(),
                 getSession()) != null)
           {
              return;
           }

        }
      // Get the address values from R_VEND_CUST_CONFG table
      String lsAddrsPrefix = loVendCustCnfg.getAD_ID_PRFX();
      boolean lboolAddrsAutoFl = loVendCustCnfg.getAD_ID_AUTO_FL();
      int liAddrsMinLength = loVendCustCnfg.getAD_ID_MIN();
      int liAddrsMaxLength = loVendCustCnfg.getAD_ID_MAX();
      long llAddrsMaxValue = (long)loVendCustCnfg.getAD_ID_MAXVAL();
      boolean liDocActionValSub = false;
      //A local variable is set to know whether action is validate or submit.
      if(getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_VALIDATE
         || getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_SUBMIT)
      {
         liDocActionValSub=true;
      }

      //Code following logic to generate a Uniq Seq. No
      if (getAD_AUTO_GEN())
      {
         String lsPntName = getPNT_ACCT_CD();
         if (!AMSStringUtil.strIsEmpty(lsPntName))
         {
            String lsSeqNm = R_ADImpl.AD_PREFIX + lsPntName;
            if (!AMSStringUtil.strIsEmpty(getN_AD_ID()))
            {
               if (!VendorUtil.isAutoGenerated(getN_AD_ID(),
                     VendorUtil.ADDRESS, lsAddrsPrefix, lsSeqNm, getSession()))
            {
               setN_AD_ID("");
               raiseException("%c:A5618,v:[b:VCM_DOC_AD/N_AD_ID]%",
                     "VCM_DOC_AD", "N_AD_ID");
            }
         }
         if(AMSStringUtil.strIsEmpty(getN_AD_ID()))
         {
            //Auto Generate a ContactNo if the Auto Generate Flag is checked
            //and ContactNo is blank.
               // If Auto Generate Flag is not checked then R_AD will auto
               // generate the
               // ContactNo.
               do
               {
                  if (lsAddrsPrefix != null)
                  {
                     setN_AD_ID(lsAddrsPrefix+ VendorUtil.genUniqNum(lsSeqNm,
                           R_VEND_CUST_CONFGImpl.VEND_MIN_VALUE,
                              llAddrsMaxValue, "R_VEND_HQ_UNID",
                              liAddrsMaxLength - lsAddrsPrefix.length()));
                  }
                  else
                  {
                     setN_AD_ID(VendorUtil.genUniqNum(lsSeqNm,
                        R_VEND_CUST_CONFGImpl.VEND_MIN_VALUE, llAddrsMaxValue,
                        "R_VEND_HQ_UNID", liAddrsMaxLength));
                  }
               } while (R_MSTR_ADImpl.getMstrAddress(getPNT_ACCT_CD(),
                     getN_AD_ID(), getSession()) != null);
            }
         }
         }
         else if(lboolAddrsAutoFl && liDocActionValSub && ( !AMSStringUtil.strIsEmpty(getN_AD_ID()) && !(getVmHdrVmAd().getVSS_INIT_FL())))
         {
            // Error is raised on validate or submit action,not on save.
            raiseException("%c:A3909,v:[b:VCM_DOC_AD/N_AD_ID]%",
               "VCM_DOC_AD", "N_AD_ID");
         }
         if (liDocActionValSub && !AMSStringUtil.strIsEmpty(getN_AD_ID()))
         {
            // Check to see if the user entered the AD_ID in limits
            // with the R_VEND_CUST_CONFG record.
            VendorUtil.chkAutoIdLimit(this,getN_AD_ID(),liAddrsMaxLength,
                                      liAddrsMinLength, "VCM_DOC_AD", "N_AD_ID");
         }
           
      } //end of assignADSeqNo




   /**
     * Method to assign Sequence Number to CNTAC_NO that is unique within a Headquarters
     * account
     * @return void
     */
     private void assignVCSeqNo()
     {
      // Get the R_VEND_CUST_CONFG record
      R_VEND_CUST_CONFGImpl loVendCustCnfg = R_VEND_CUST_CONFGImpl.getVendCustConfigRec(getSession());

      if (loVendCustCnfg == null)
      {
         // No record on the R_VEND_CUST_CONFG table, return;
         raiseException("%c:A3910%");
         return;
      }

      // Get the contact values from R_VEND_CUST_CONFG table
      String lsCntcPrefix = loVendCustCnfg.getCNTC_ID_PRFX();
      boolean lboolCntcAutoFl = loVendCustCnfg.getCNTC_ID_AUTO_FL();
      int liCntcMinLength = loVendCustCnfg.getCNTC_ID_MIN();
      int liCntcMaxLength = loVendCustCnfg.getCNTC_ID_MAX();
      long llCntcMaxValue = (long)loVendCustCnfg.getCNTC_ID_MAXVAL();
      boolean liDocActionValSub = false;

    if (!AMSStringUtil.strIsEmpty(getCNTAC_NO())
            && !AMSStringUtil.strIsEmpty(getPNT_ACCT_CD()))
      {
         // Check to see if the Contact ID is valid on the R_MSTR_AD table
         // If valid no error return as this is the existing Contact.
         // This check is just done for baseline, as there might be existing
         // clients
         // with existing contact codes.
         if (R_VEND_CNTACImpl.getContactInfo(getSession(), getPNT_ACCT_CD(),
               getCNTAC_NO()) != null)
         {
            return;
         }

      }
      //A local variable is set to know whether action is validate or submit.
      if(getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_VALIDATE
         || getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_SUBMIT)
      {
         liDocActionValSub=true;
      }
      // No need to process if Principal Contact Name is not given.
      if(!AMSStringUtil.strIsEmpty(this.getPRIN_CNTAC()))
      {
      //Code following logic to generate a Uniq Seq. No
      if (getCN_AUTO_GEN())
      {
         String lsPntName = getPNT_ACCT_CD();
         if (!AMSStringUtil.strIsEmpty(lsPntName))
         {
            String lsSeqNm = R_VEND_CUST_CONFGImpl.CNTC_ID_PRFX+ lsPntName;
            if (!AMSStringUtil.strIsEmpty(getCNTAC_NO()))
            {
               if (!VendorUtil.isAutoGenerated(getCNTAC_NO(),
                     VendorUtil.CONTACT, lsCntcPrefix, lsSeqNm, getSession()))
            {
               setCNTAC_NO("");
               raiseException("%c:A5618,v:[b:VCM_DOC_AD/CNTAC_NO]%",
                     "VCM_DOC_AD", "CNTAC_NO");
            }
            }
         if (AMSStringUtil.strIsEmpty(getCNTAC_NO()))
         {
            //Auto Generate a ContactNo if the Auto Generate Flag is checked
            //and ContactNo is blank.
               // If Auto Generate Flag is not checked then R_AD will auto
               // generate the
               // ContactNo.
               if (lsCntcPrefix != null)
               {
              setCNTAC_NO(lsCntcPrefix+ VendorUtil.genUniqNum(lsSeqNm,
                           R_VEND_CUST_CONFGImpl.VEND_MIN_VALUE,
                           llCntcMaxValue, "R_VEND_HQ_UNID", liCntcMaxLength
                                    - lsCntcPrefix.length()));               }
               else
               {
                  setCNTAC_NO(VendorUtil.genUniqNum(lsSeqNm,
                        R_VEND_CUST_CONFGImpl.VEND_MIN_VALUE, llCntcMaxValue,
                        "R_VEND_HQ_UNID", liCntcMaxLength));
               }
            }
         }
      }
         else if(lboolCntcAutoFl  && liDocActionValSub && ( !AMSStringUtil.strIsEmpty(getCNTAC_NO()) && !(getVmHdrVmAd().getVSS_INIT_FL())))
         {
            // Error is raised on validate or submit action,not on save.
            raiseException("%c:A3909,v:[b:VCM_DOC_AD/CNTAC_NO]%",
               "VCM_DOC_AD", "CNTAC_NO");
         }
         if (liDocActionValSub && !AMSStringUtil.strIsEmpty(getCNTAC_NO()))
         {
            // Check to see if the user entered the Contact Id is in limits
            // with the R_VEND_CUST_CONFG record.
            // Error is raised on validate or submit action,not on save.
           VendorUtil.chkAutoIdLimit(this,getCNTAC_NO(),liCntcMaxLength,
                                      liCntcMinLength, "VCM_DOC_AD", "CNTAC_NO");
         }
      }
     }//end of assignVCSeqNo




/**
* Method for implementing common beforeInsert/beforeUpdate logic
* @return void
*/
private void commonBeforeLogic()
{
	VCM_DOC_HDRImpl loVcmHdr = getVmHdrVmAd();

   //Check the line action, if is a modify, make sure the address type and id don't already exist
   //this is to prevent the user from modifying vendor/contact address information of an existing address.
   //ADVFN00002697
   if(getLN_ACTN() == CVL_LN_ACTN2Impl.MODIFY)
   {
      SearchRequest lsr = new SearchRequest();
      lsr.addParameter("R_AD", "AD_ID", getM_AD_ID());
      lsr.addParameter("R_AD", "AD_TYP", getM_AD_TYP());
      lsr.addParameter("R_AD", "VEND_CUST_CD", loVcmHdr.getVEND_CUST_CD());
      int count = R_ADImpl.getObjectCount(lsr, this.getSession());

      if (count > 0)
      {

         R_ADImpl loAd= R_ADImpl.getAddressInfo(this.getSession(), loVcmHdr.getVEND_CUST_CD(), getM_AD_TYP(), getM_AD_ID());
         if  (loAd != null)
         {
            Vector lvEFTFields = new Vector();
            for(int liCounter = 0; liCounter < EFT_FIELDS.length; liCounter++)
            {
               lvEFTFields.addElement(EFT_FIELDS[liCounter]);
            }

            //Infer All the editable fields once when line get inserted
            if( AMSStringUtil.strEqual(getM_AD_TYP(), getOldM_AD_TYP()) &&
                AMSStringUtil.strEqual(getM_AD_ID(), getOldM_AD_ID()) )
            {
               /* 
                * Exclude the editable fields to copy from the Reference Table R_AD
                * So that it shouldn't revert back editable fields to the value from what's on R_AD 
                * And should process whatever they provided on the VCM.
                */
               for(int liCounter = 0; liCounter < AD_EDTBLE_FIELDS.length; liCounter++)
               {
                  lvEFTFields.addElement(AD_EDTBLE_FIELDS[liCounter]);
               }
            }   

            /*
             * copyCorresponding will copy all common fields from R_AD to VCM_DOC_AD,
             * but will not override the existing values. copyCorresponding() has been
             * added to overcome the situation where these fields are not modified
             * but left blank and other informations are updated.
             */
             this.copyCorresponding(loAd, lvEFTFields, false );
             
             if(( getDOC_ACTN_CD() == DOC_ACTN_SUBMIT || getDOC_ACTN_CD() == DOC_ACTN_VALIDATE ) && 
                ( !AMSStringUtil.strEqual(isAddFldEmpty(getSTR_1_NM()), loAd.getSTR_1_NM(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getSTR_2_NM()), loAd.getSTR_2_NM(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getCITY_NM()), loAd.getCITY_NM(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getST()), loAd.getST(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getZIP()), loAd.getZIP(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getCNTY_CD()), loAd.getCNTY_CD(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getCTRY_PH_CD()), loAd.getCTRY_PH_CD(), true) ||
                  !AMSStringUtil.strEqual(String.valueOf(getVOICE_PH_NO()).replaceAll("\\D", ""), String.valueOf(loAd.getVOICE_PH_NO()).replaceAll("\\D", "") , true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getVOICE_PH_EXT()), loAd.getVOICE_PH_EXT(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getDUNS_NO()), loAd.getDUNS_NO(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getDUNS_NO_EXT()), loAd.getDUNS_NO_EXT(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getUEI_NO()), loAd.getUEI_NO(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getCAGE_CD()), loAd.getCAGE_CD(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty((getST_HWY_DSTC())), loAd.getST_HWY_DSTC(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getZONE()), loAd.getZONE(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getREGION()), loAd.getREGION(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getLGSLV_CONGL_DSTC()), loAd.getLGSLV_CONGL_DSTC(), true) ||
                  !AMSStringUtil.strEqual(isAddFldEmpty(getOTHR()), loAd.getOTHR(), true)))
             {
                 raiseException("%c:A3464%");
                 return;
             }
        }
      }
   }

   //Get PNT_ACCT_CD from header and set it here so it can be used in relationships
   setPNT_ACCT_CD(loVcmHdr.getPNT_ACCT_CD());

   //Get VEND_CUST_CD from header and set it here just to make sure in case
   //parent replicates have not fired yet.
   setVEND_CUST_CD(loVcmHdr.getVEND_CUST_CD());

   if( getLN_ACTN() == CVL_LN_ACTN2Impl.NEW )
   {
      //Call method to assign N_AD_ID
      assignADSeqNo();

      setM_AD_ID(null);
      setM_AD_TYP(null);
      setAD_ID(getN_AD_ID());
      setAD_TYP(getN_AD_TYP());
      //Set Country Code
      VendorUtil.setCtryCd(this,getSession());
      VendorUtil.setCtryCdInAddressAndContactInfo(this,getSession());

   }
   else if( (getLN_ACTN() == CVL_LN_ACTN2Impl.MODIFY) ||
          (getLN_ACTN() == CVL_LN_ACTN2Impl.DELETE)   )
   {
      setN_AD_ID(null);
      setN_AD_TYP(null);
      setAD_ID(getM_AD_ID());
      setAD_TYP(getM_AD_TYP());
      //Set Country Code
      VendorUtil.setCtryCd(this,getSession());
      VendorUtil.setCtryCdInAddressAndContactInfo(this,getSession());

   }

   //Get R_EXP_SOPT record for the current Fiscal Year

   /*
    * Infer EFT Format from SOPT if EFT Format is empty and ABA number, Account Number,
    * Account Type field is populated and EFT Status is set to any 1 value of Prenote Requested or Prenote Pending or
    * or Prenote Pending or Eligible for EFT at the time of inserting or modifying a record.
    */
   if (!AMSStringUtil.strIsEmpty(this.getVEND_CUST_CD()) &&
       !AMSStringUtil.strIsEmpty(this.getAD_ID()) &&
        AMSStringUtil.strIsEmpty(this.getEFT_FRMT()) &&
       !AMSStringUtil.strIsEmpty(this.getABA_NO()) &&
       !AMSStringUtil.strIsEmpty(this.getACCT_NO_VIEW()) &&
        this.getACCT_TYP() != 0 &&
       (this.getEFT_STA() == CVL_EFT_STAImpl.PRENOTE_REQUESTED ||
        this.getEFT_STA() == CVL_EFT_STAImpl.PRENOTE_PENDING ||
        this.getEFT_STA() == CVL_EFT_STAImpl.ELIGIBLE_FOR_EFT ||
        this.getEFT_STA() == CVL_EFT_STAImpl.EWS_REQUESTED ||
        this.getEFT_STA() == CVL_EFT_STAImpl.EWS_PENDING))
   {
      //Get current Fiscal Year
      int liFY = R_CLDTImpl.getCLDTInfoFY(getSession());
      inferEFTFrmt(R_EXP_SOPTImpl.getEXPSOPTRecord(liFY, getSession()));
   }
   //Assign auto-generated Contact Id if required.
   assignVCSeqNo();


   //Get handle on corresponding table record using relationship
   //getter and set the member variable if Line Action is not new. If new
   //case do not set to anything here
   if( getLN_ACTN() != CVL_LN_ACTN2Impl.NEW )
   {
      moAd = getAdVmAd();
   }

   // Infer EFT Status.
   if( getEFT_STA() == 0 )
   {
      setEFT_STA(VendorUtil.getDefaultEFTStatus(this, moAd, getSession()));
   }

   //Pass PNT_ACCT_CD abd AD_ID to R_MSTR_AD and get handle on it.
   //do this lookup here so that loMstrAd is also available for use elsewhere in this method
   R_MSTR_ADImpl loMstrAd = R_MSTR_ADImpl.getMstrAddress(getPNT_ACCT_CD(), getN_AD_ID(),
                                               getSession() );

   if( (loMstrAd != null ) && ( getLN_ACTN() == CVL_LN_ACTN2Impl.NEW ) )
   {

      //If system is going to re-infer values in address fields (for same New Address Id
      //and  valid loMstrAd)that are different than original values then issue a warning on
      //save that user entries have been replaced
      if( (AMSStringUtil.strIsEmpty(getOldN_AD_ID()) ||
            AMSStringUtil.strEqual(getN_AD_ID(),getOldN_AD_ID(),false))  &&
         (VendorUtil.compareTo(this,loMstrAd,VendorUtil.AD_COMPARE,false) != 0) )
      {

         raiseException("%c:A2972,v:"+getN_AD_ID()+" %");
      }

      VendorUtil.copyAttsInStrArray(loMstrAd,this,VendorUtil.AD_COMPARE);


   }



   //If system has re-inferred values in address fields (for
   //same Old AdId/AdTyp combination) that are different than original values then
   //issue a warning on save that user entries have been replaced
   if( (getmoAd() != null) &&
      AMSStringUtil.strEqual(getM_AD_ID(),getOldM_AD_ID(),false) &&
      AMSStringUtil.strEqual(getM_AD_TYP(), getOldM_AD_TYP(),false) &&

      ( !AMSStringUtil.strEqual(getSTR_1_NM(), getOldSTR_1_NM(), true) ||
        !AMSStringUtil.strEqual(getSTR_2_NM(), getOldSTR_2_NM(), true) ||
        !AMSStringUtil.strEqual(getCITY_NM(), getOldCITY_NM(), true) ||
        !AMSStringUtil.strEqual(getST(), getOldST(), true) ||
        !AMSStringUtil.strEqual(getZIP(), getOldZIP(), true) ||
        !AMSStringUtil.strEqual(getCNTY_CD(), getOldCNTY_CD(), true) ||
        !AMSStringUtil.strEqual(getCTRY_PH_CD(), getOldCTRY_PH_CD(), true) ||
        !AMSStringUtil.strEqual(getVOICE_PH_NO(), getOldVOICE_PH_NO(), true) ||
        !AMSStringUtil.strEqual(getVOICE_PH_EXT(), getOldVOICE_PH_EXT(), true) ||
        !AMSStringUtil.strEqual(getDUNS_NO(), getOldDUNS_NO(), true) ||
        !AMSStringUtil.strEqual(getDUNS_NO_EXT(), getOldDUNS_NO_EXT(), true) ||
        !AMSStringUtil.strEqual(getUEI_NO(), getOldUEI_NO(), true) ||		
        !AMSStringUtil.strEqual(getCAGE_CD(), getOldCAGE_CD(), true) ||
        !AMSStringUtil.strEqual(getST_HWY_DSTC(), getOldST_HWY_DSTC(), true) ||
        !AMSStringUtil.strEqual(getZONE(), getOldZONE(), true) ||
        !AMSStringUtil.strEqual(getREGION(), getOldREGION(), true) ||
        !AMSStringUtil.strEqual(getLGSLV_CONGL_DSTC(), getOldLGSLV_CONGL_DSTC(), true) ||
        !AMSStringUtil.strEqual(getOTHR(), getOldOTHR(), true)))
   {
      raiseException("%c:A2972,v:"+getM_AD_ID()+" %");
   }



   // Infer some fields from R_VEND_CNTAC if  CNTAC_NO is valid on R_CNTAC_NO
   //do this lookup here so that loVendCntac is also available for use elsewhere in
   //this method
   R_VEND_CNTACImpl loVendCntac = R_VEND_CNTACImpl.getContactInfo(getSession(),
                                                   getPNT_ACCT_CD(),
                                                   getCNTAC_NO() );

   if( loVendCntac != null )
   {


      //If system will infer values in contact address fields (for same CNTAC_NO and valid
      //loVendCntac) that are different than original values then issue a warning on save.

      if( (AMSStringUtil.strIsEmpty(getOldCNTAC_NO()) ||
         AMSStringUtil.strEqual(getCNTAC_NO(), getOldCNTAC_NO(), false)) &&
         (VendorUtil.compareTo(this,loVendCntac,VendorUtil.PC_COMPARE,
                              VendorUtil.VEND_CNTAC_FIELDS,false) != 0) )
       {

            raiseException("%c:A2957,v:"+getCNTAC_NO()+" %");

       }

       VendorUtil.copyAttsInStrArray(loVendCntac,this,VendorUtil.VEND_CNTAC_FIELDS,
                              VendorUtil.PC_COMPARE);

   }

      //Infer Remittance Advice Transmission Mode value from R_AP_DISB_FRMT Table
      //for given RA Transmission Mode
      R_VEND_CUSTImpl.inferValuesFromDisbFormatTable(getSession(), this);
	
   if( isBankingInformationChanged() )
   {
      String lsDfltEftSta = VendorUtil.updateEftStatus( this, getSession() );
      if(!AMSStringUtil.strIsEmpty(lsDfltEftSta) && VendorUtil.checkEftDetails(this, getSession()))
      {
         if(AMSStringUtil.strInsensitiveEqual(lsDfltEftSta, "E"))
         {
            setEFT_STA(CVL_EFT_STAImpl.EWS_REQUESTED ); 
         }
         else
         { 
            setEFT_STA(CVL_EFT_STAImpl.PRENOTE_REQUESTED);
         }
      }
   }

   boolean lboolPreviousGenerateFlag = getALW_EFT_FL();
   int liPreviousEftStatus = getEFT_STA();

   if (moAd != null)
   {
      lboolPreviousGenerateFlag = moAd.getALW_EFT_FL();
      liPreviousEftStatus = moAd.getEFT_STA();
   }
   
   if (getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_VALIDATE ||
       getDOC_ACTN_CD() == AMSCommonConstants.DOC_ACTN_SUBMIT)
   {
      if ( isBankingInformationChanged() && 
         ((this.getEFT_STA() == CVL_EFT_STAImpl.PRENOTE_PENDING || this.getEFT_STA() == CVL_EFT_STAImpl.EWS_PENDING) || 
           getALW_EFT_FL()) )
      {
         /*
          * Error:  Banking Information cannot be modified if the EFT Generate Payment flag
          * is checked or the EFT Status is not Prenote Pending or EWS Pending.
          */
         raiseException("%c:A8928%");
      }	
   }
   
}//end of commonBeforeLogic


      /**
        * Method to return the member variable storing Address record
        * @return R_ADImpl
        */
        public R_ADImpl getmoAd()
        {
           return moAd;

        }//end of getmoAd



  /**
   * Method to handle table updates.  Until Infrastructure supports execution of document
   * components in specified sequence, this method will be called from Header.
   * @return void
   */
   public void handleTableUpdates()
   {

      try
      {

         //Explicitly set the error context here to make sure correct error context is set
         //when update is initiated from the header
         setErrorContext();

         //Return if a valid getmoAd is not available at this time
         if( getmoAd() == null )
         {
            return;
         }

         //Check the Line Action on this document component.
         if( getLN_ACTN() == CVL_LN_ACTN2Impl.DELETE )
         {
            getmoAd().setDelete();
            getmoAd().save();
         }
         else
         {

            String lsCreatedBy = null;
            VSDate loCreatedOn = null;
            VCM_DOC_HDRImpl loVcmDocHeadrHandle = getVmHdrVmAd();

            if( getLN_ACTN() == CVL_LN_ACTN2Impl.MODIFY )
            {
               //Issue error if VER_CTRL_NO on this component does not match
               //AMS_ROW_VERS_NO on the table record for line Action of modify
               if( getDOC_ACTN_CD() != AMSCommonConstants.DOC_ACTN_SUBMIT && (getVER_CTRL_NO() != getmoAd().getAMS_ROW_VERS_NO()) )
               {
                  raiseException("%c:A2956%");
                  return;
               }
            }
            else if( getLN_ACTN() == CVL_LN_ACTN2Impl.NEW )
            {
               if(loVcmDocHeadrHandle != null)
               {
                  //set lsCreatedBy and lsCreated On
                  lsCreatedBy = getDOC_CREA_USID();
                  loCreatedOn = loVcmDocHeadrHandle.getDOC_APPL_LAST_DT();
               }
            }

            //MASS CUSTOM START

            //Pass this object as User Object, which will be caught in AMSAddressValidator
            //to check the BYPASS_FL attribute on this object to determine whether to
            //bypass First Logic validations
             setAppUserObject(VendorUtil.BYPASS,this,getSession());

             //MASS CUSTOM END

             // Set the EFT Status Description in R_AD table.
             this.getmoAd().setHLD_REAS(this.getREJ_HLD_REAS());

            //Get the corresponding Vendor Table record and update it.
            //Pass �false� since we do not want to save the record just yet. The following
            //method will update the change management fields and then issue a save. This
            //avoids double �saves� on the tables and improves performance.
            VendorUtil.updateVendorTables(this, this.getmoAd(),
                                       getVmHdrVmAd().mvExclude, false);
             this.getmoAd().setACCT_NO(this.getACCT_NO());
             this.getmoAd().setPARITY_STR(this.getPARITY_STR() );
             // EFT_STA and ALW_EFT_FL are in EFT_FIELDS and excluded from updateVendorTables via mvExclude;
             // they must be explicitly written back to R_AD so user changes are persisted.
             this.getmoAd().setEFT_STA(this.getEFT_STA());
             this.getmoAd().setALW_EFT_FL(this.getALW_EFT_FL());

            //Update Change Management fields on the Address table record. If line action
            //is modify pass nulls for Created By and Created On parameters so that
            //those values are not updated on the table, if line action is new then pass
            //Document Created By and Document Last Modified On as Created By and Created
            //On dates for the table.
            VendorUtil.populateChangeManagementFields(getmoAd(), lsCreatedBy,
                                            loCreatedOn,getVmHdrVmAd().msCreatedBy,
                                            getVmHdrVmAd().moLastModifiedOn,
                                            getVmHdrVmAd().msLastApprovedBy,
                                            getVmHdrVmAd().moLastApprovedOn,
                                            true, AMSSAVEBEHAVIOR_REF_DOC_SAVE );


            //MASS CUSTOM START:
            //Now that a save has been performed on R_AD table,
            //copy Address information back to the document so that
            //users can see what First Logic updated on the table.
            //Only do this if respective booleans mboolSameNewCntacId and
            //mboolSameNewAdId are false since we do not want to bring back
            //data on such records
            if( !mboolSameNewAdId && !mboolSameAdIdAsMstr )
            {
               VendorUtil.copyAttsInStrArray(getmoAd(),this,VendorUtil.AD_COMPARE);
            }

            if( !mboolSameNewCntacId && !mboolSameCntacNoAsCntact )
            {
               VendorUtil.copyAttsInStrArray(getmoAd(),this,VendorUtil.PC_COMPARE);
            }

            //MASS CUSTOM END




         }
      }
      catch( Exception ex)
      {
         if (moAMSLog.isErrorEnabled())
         {
            moAMSLog.error("Exception while updating R_AD table "+ex.getMessage(), ex);
         }


      }
      finally
      {
         //reset the error context
         clearErrorContext();
      }




   }//end of handleTableUpdates



  /**
   *   Method Name: getContext
   *
   *   Set the context for error messages for this component.
   */
   public String getContext()
   {
       return createContext("AD");
   }


//MASS CUSTOM START:

/**
  * public setter method for mboolSameCntacNoAsCntact so that other components can
  * set the value for this instance of VCM_DOC_AD as required
  * @return void
  */
  public void setmboolSameCntacNoAsCntact( boolean fbool )
  {
     mboolSameCntacNoAsCntact = fbool;
  }


/**
  * public setter method for mboolSameCntacNoAsCntact so that other components can
  * set the value for this instance of VCM_DOC_AD as required
  * @return void
  */
  public void setmboolSameAdIdAsMstr( boolean fbool )
  {
     mboolSameAdIdAsMstr = fbool;
  }

//MASS CUSTOM END:
   /**
   * This method infers the EFT Format
   * from R_EXP_SOPT, if it is left blank.
   * @param foSOPT: Instance of R_EXP_SOPT record.
   * @return void.
   */
   public void inferEFTFrmt(R_EXP_SOPTImpl foSOPT)
   {
      if(! AMSStringUtil.strEqual(this.getAD_TYP(), CVL_AD_TYPImpl.PAYMENT) )
      {
         return;
      }
      if(foSOPT != null && !AMSStringUtil.strIsEmpty(foSOPT.getVEND_DFLT_EFT_FRMT())
              && foSOPT.getEXT_DISB_OPT() != CVL_EXT_DISB_OPTImpl.DISBURSEMENTS_AND_CLAIMS)
      {
         this.setEFT_FRMT(foSOPT.getVEND_DFLT_EFT_FRMT());
      }
   }//End inferEFTFrmt


  /**
   * Determines whether Banking information has been changed since the previous version..
   *
   * @return boolean - true EFT Status is valid, otherwise false.
   */
   protected boolean isBankingInformationChanged()
   {
      boolean lboolBankInfoChanged = false;

      if (getLN_ACTN() == CVL_LN_ACTN2Impl.NEW)
      {
         if (!AMSStringUtil.strIsEmpty(getABA_NO()) ||
             !AMSStringUtil.strIsEmpty(getACCT_NO_VIEW()) ||
             !AMSStringUtil.strIsEmpty(getROUT_ID()) ||
              getACCT_TYP() != 0)
         {
            lboolBankInfoChanged = true;
         }
      }
      else if (getLN_ACTN() == CVL_LN_ACTN2Impl.MODIFY)
      {
         SearchRequest loSearchRequest = new SearchRequest();

         loSearchRequest.addParameter("R_AD", "AD_TYP", getAD_TYP());
         loSearchRequest.addParameter("R_AD", "AD_ID", getAD_ID());
         loSearchRequest.addParameter("R_AD", "VEND_CUST_CD", getVEND_CUST_CD());

         R_ADImpl loRelAd = (R_ADImpl) R_ADImpl.getObjectByKey(loSearchRequest, getSession());

         if (loRelAd != null)
         {
            // Strings that are both null are considered equal.
            if (!AMSStringUtil.strEqual(getABA_NO(), loRelAd.getABA_NO(), true) ||
                !AMSStringUtil.strEqual(getACCT_NO_VIEW(), loRelAd.getACCT_NO_VIEW(), true) ||
                !AMSStringUtil.strEqual(getROUT_ID(), loRelAd.getROUT_ID(), true) ||
                 getACCT_TYP() != loRelAd.getACCT_TYP())
            {
                lboolBankInfoChanged = true;
            }
         }
      }

      return lboolBankInfoChanged;
   }
   /*
   * This method is to check the EFT details have been updated or not to use in BORULE
   */
   public boolean isBankingInformationUpdated()
   {
      return isBankingInformationChanged();
   }

	/**
	 * Function used to call the Address Standardization service if it is
	 * 
	 */
	private void checkAddrStandard() {

		// if address has been changed or standardization has not yet been run,
		// set the property to True so that
		// standardization will be run
		int liCnt = 0;
		msMelissaEnabled = IN_APP_CTRLImpl.getParameterValue("BYPASS_SYSWIDE_AD_VAL", getSession());
		if (!AMSStringUtil.strInsensitiveEqual(msMelissaEnabled, "TRUE") && (getBYPASS_FL()== false)) {

			

			moAddrStdHelper = new ADVAddressStandardizationHelper(fsHomeAddr);
			for (int j = 0; j < fsHomeAddr.length; j++) {

				if (this.getData(fsHomeAddr[j]) == null || this.getData(fsHomeAddr[j]).getString() == null) {
					liCnt++;
				}
				if (liCnt == fsHomeAddr.length) {
					return;
				}
			}
			// Send Standardization request to Advantage Connect
			if (!moAddrStdHelper.sendAddressStdznRequest(this)) {

				raiseException("%c:A9380");
				return;
			}
			setStandardizedAddresInfo();

		}

	}

	/**
	 * Function used to set the standardized address information into the
	 * ADDR_DOC_HDR table
	 */
	private void setStandardizedAddresInfo() {
		JSONArray loArrAddrStdzdData = moAddrStdHelper.getAddressResponseData();
		
		if (loArrAddrStdzdData != null) {
			JSONObject loHomeAddrResponse = loArrAddrStdzdData.getJSONObject(0);

			if (loHomeAddrResponse != null) {
				if (AMSStringUtil.strEqual(String.valueOf(loHomeAddrResponse.get("addressValStatus")), "F")) {
					String lsResultCodes = String.valueOf(loHomeAddrResponse.get("additionalInputDataBase"));


					VendorUtil.checkMelissaErrCdAllowed(lsResultCodes,this,this.getSession());
					
					
				}
				if (AMSStringUtil.strEqual(String.valueOf(loHomeAddrResponse.get("addressValStatus")), "S")) {

					setSTR_1_NM(moAddrStdHelper.getStreetName(loHomeAddrResponse));
					setSTR_2_NM(moAddrStdHelper.getStreet2Name(loHomeAddrResponse));
					setCITY_NM(moAddrStdHelper.getCity(loHomeAddrResponse));
					setST(moAddrStdHelper.getStateOrProvince(loHomeAddrResponse));
					setZIP(moAddrStdHelper.getZipOrPostalCode(loHomeAddrResponse));
					setCTRY(moAddrStdHelper.getCountry(loHomeAddrResponse));
					raiseException("%c:A9382", AMSMsgUtil.SEVERITY_LEVEL_INFO);
				}

			}
		}
	}
    
    /**
    * This method will return field value of address if not empty.
    * @param String foValue: value of field from address.
    * @return String lsAddFldVal: returing value after empty check.
   */
   private String isAddFldEmpty(String foValue)
   {
      return AMSStringUtil.strIsEmpty(foValue) ? null :foValue;
   }

      
   /**
    * This method will return False if there no change in ActiveTO date of
    * Vendor transaction and R_AD date.
    * 
    * @param fsVCUSTCd Vendor customer code.
    * @param fsAddID Vendor address ID.
    * @param fsAddTyp Type of vendor address.
    * @param foSession Current session.
    * 
    * @return true if the dates are different, false otherwise.
    */
   public boolean isEffDtChanged( String fsVCUSTCd, String fsAddID,
         String fsAddTyp, Session foSession )
   {
      VSDate ldEffDate = null;
      ResultSet loResultSet = null;
      DataRow loRow = null;
      try
      {    
         SearchRequest loSearchRequest = new SearchRequest();
         loSearchRequest.addParameter( "R_AD", "VEND_CUST_CD", fsVCUSTCd );
         loSearchRequest.addParameter( "R_AD", "AD_TYP", fsAddTyp );
         loSearchRequest.addParameter( "R_AD", "AD_ID", fsAddID );
         R_ADImpl loRADImpl = (R_ADImpl)R_ADImpl
               .getObjectByKey( loSearchRequest, foSession );
         if( loRADImpl != null )
         {
            ldEffDate = loRADImpl.getData( "EFEND_DT" ).getVSDate();
         }
         if( ldEffDate != null && ldEffDate.equals( getEFEND_DT() ) )
         {
            return false;
         }
         else if( ldEffDate == getEFEND_DT() )
         {
            return false;
         }
         else if( ldEffDate != null && getEFEND_DT() == null )
         {
            return false;
         }
      } catch( Exception loEx )
      {
         if( moAMSLog.isErrorEnabled() )
         {
            moAMSLog.error( "Error checking effective date changes: "
                  + loEx.getMessage(), loEx );
         }
      }
      return true;
   }

}
