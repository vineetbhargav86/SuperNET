/******************************************************************************
 * Copyright © 2014-2016 The SuperNET Developers.                             *
 *                                                                            *
 * See the AUTHORS, DEVELOPER-AGREEMENT and LICENSE files at                  *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * SuperNET software, including this file may be copied, modified, propagated *
 * or distributed except according to the terms contained in the LICENSE file *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/

#include "iguana777.h"

bits256 SuperNET_wallet2shared(bits256 wallethash,bits256 wallet2priv)
{
    bits256 wallet2shared,seed,wallet2pub;
    wallet2pub = curve25519(wallet2priv,curve25519_basepoint9());
    seed = curve25519_shared(wallethash,wallet2pub);
    vcalc_sha256(0,wallet2shared.bytes,seed.bytes,sizeof(bits256));
    return(wallet2shared);
}

bits256 SuperNET_wallet2priv(char *wallet2fname,bits256 wallethash)
{
    char *wallet2str; uint32_t r,i,crc; long allocsize; bits256 wallet2priv;
    wallet2priv = GENESIS_PRIVKEY;
    if ( wallet2fname[0] != 0 && (wallet2str= OS_filestr(&allocsize,wallet2fname)) != 0 )
    {
        r = crc = calc_crc32(0,wallet2str,(int32_t)allocsize);
        r %= 32;
        for (i=0; i<allocsize; i++)
            wallet2str[i] ^= wallethash.bytes[(i + r) % 32];
        vcalc_sha256(0,wallet2priv.bytes,(void *)wallet2str,(int32_t)allocsize);
        free(wallet2str);
        //char str[65]; printf("wallet2priv.(%s) from.(%s) crc.%u and passphrase r.%d len.%ld\n",bits256_str(str,wallet2priv),wallet2fname,crc,r,allocsize);
    } else if ( wallet2fname[0] != 0 )
        printf("SuperNET_wallet2priv cant open (%s)\n",wallet2fname);
    return(wallet2priv);
}

char *SuperNET_parsemainargs(struct supernet_info *myinfo,bits256 *wallethashp,bits256 *wallet2privp,char *argjsonstr)
{
    cJSON *exchanges=0,*json = 0; char *wallet2fname,*coinargs=0,*secret,*filestr;
    long allocsize; bits256 wallethash,wallet2priv; int32_t n,len; uint8_t secretbuf[8192];
    wallethash = wallet2priv = GENESIS_PRIVKEY;
    if ( argjsonstr != 0 )
    {
        if ( (filestr= OS_filestr(&allocsize,argjsonstr)) != 0 )
        {
            json = cJSON_Parse(filestr);
            free(filestr);
        }
        if ( json != 0 || (json= cJSON_Parse(argjsonstr)) != 0 )
        {
            printf("ARGSTR.(%s)\n",argjsonstr);
            if ( jobj(json,"numhelpers") != 0 )
                IGUANA_NUMHELPERS = juint(json,"numhelpers");
            if ( (secret= jstr(json,"passphrase")) != 0 )
            {
                len = (int32_t)strlen(secret);
                if ( is_hexstr(secret,0) != 0 && len == 128 )
                {
                    len >>= 1;
                    decode_hex(secretbuf,len,secret);
                } else vcalc_sha256(0,secretbuf,(void *)secret,len), len = sizeof(bits256);
                memcpy(wallethash.bytes,secretbuf,sizeof(wallethash));
                //printf("wallethash.(%s)\n",bits256_str(str,wallethash));
                if ( (wallet2fname= jstr(json,"permanentfile")) != 0 )
                    wallet2priv = SuperNET_wallet2priv(wallet2fname,wallethash);
            }
            exchanges = jarray(&n,json,"exchanges");
            if ( jobj(json,"coins") != 0 )
                coinargs = argjsonstr;
            free_json(json);
        }
    }
    if ( exchanges != 0 )
        exchanges777_init(myinfo,exchanges,0);
    *wallethashp = wallethash, *wallet2privp = wallet2priv;
    return(coinargs);
}

bits256 SuperNET_linehash(char *_line)
{
    int32_t i,j; bits256 hash;
    /*if ( _line[strlen(_line)-1] == '\'' && strncmp(_line,match,len) == 0 )
    {
        _line[strlen(_line)-1] = 0;
        _line += len;
    }
    printf("%02x %02x %02x %02x %02x\n",0xff & _line[0],0xff & _line[1],0xff & _line[2],0xff & _line[3],0xff & _line[4]);*/
    for (i=j=0; _line[i]!=0; i++)
    {
        if ( (uint8_t)_line[i] == 0xe2 && (uint8_t)_line[i+1] == 0x80 )
        {
            if ( (uint8_t)_line[i+2] == 0x99 )
                _line[j++] = '\'', i += 2;
            else if ( (uint8_t)_line[i+2] == 0x9c || (uint8_t)_line[i+2] == 0x9d )
                _line[j++] = '"', i += 2;
            else _line[j++] = _line[i];
        }
        else _line[j++] = _line[i];
        //else if ( (uint8_t)_line[i] == 0x9c )
        //  _line[i] = '"';
    }
    _line[j++] = 0;
    if ( j == sizeof(bits256)*2 && is_hexstr(_line,j) == j )
        decode_hex(hash.bytes,sizeof(hash),_line);
    else vcalc_sha256(0,hash.bytes,(void *)_line,j);
    //char str[65]; printf("line -> (%s)\n",bits256_str(str,hash));
    return(hash);
}

int32_t SuperNET_savejsonfile(char *fname,bits256 privkey,bits256 destpubkey,cJSON *json)
{
    char *confstr,*ciphered; FILE *fp;
    confstr = jprint(json,0);
    if ( bits256_nonz(privkey) != 0 && bits256_cmp(privkey,GENESIS_PUBKEY) != 0 )
    {
        //sprintf(fname,"confs/iguana.%llu",(long long)wallet2shared.txid);
        if ( (ciphered= SuperNET_cipher(0,0,json,0,privkey,destpubkey,confstr)) != 0 )
        {
            printf("save (%s) <- (%s)\n",fname,confstr);
            if ( (fp= fopen(fname,"wb")) != 0 )
            {
                fwrite(ciphered,1,strlen(ciphered)+1,fp);
                fclose(fp);
            }
            free(ciphered);
        } else printf("error ciphering.(%s) (%s)\n",fname,confstr);
    }
    else
    {
        //sprintf(fname,"confs/iguana.conf");
        //printf("save (%s) <- (%s)\n",fname,confstr);
        if ( (fp= fopen(fname,"wb")) != 0 )
        {
            fwrite(confstr,1,strlen(confstr)+1,fp);
            fclose(fp);
        }
    }
    free(confstr);
    return(0);
}

int32_t SuperNET_userkeys(char *passphrase,int32_t passsize,char *fname2fa,int32_t fnamesize)
{
    return(0);
#ifndef __PNACL
    //if ( (bits256_nonz(*wallethashp) == 0 || bits256_cmp(*wallethashp,GENESIS_PRIVKEY) == 0) && (bits256_nonz(*wallet2privp) == 0 || bits256_cmp(*wallet2privp,GENESIS_PRIVKEY) == 0) )
    {
        sleep(1);
        printf("\n\n********************************\n");
        if ( OS_getline(1,passphrase,passsize-1,"passphrase: ") > 0 )
            ;
        if ( OS_getline(1,fname2fa,fnamesize-1,"enter filename of a file that you will NEVER lose: ") > 0 )
            ;
        return(0);
    }
#endif
    return(-1);
}

cJSON *SuperNET_decryptedjson(char *passphrase,int32_t passsize,bits256 wallethash,char *fname2fa,int32_t fnamesize,bits256 wallet2priv)
{
    long allocsize; cJSON *filejson,*msgjson=0,*json=0; char *confstr=0,*deciphered,fname[512],str[65];
    bits256 wallet2shared,wallet2pub; int32_t first,second;
    msgjson = 0;
    first = (bits256_nonz(wallethash) != 0 && bits256_cmp(wallethash,GENESIS_PRIVKEY) != 0);
    second = (bits256_nonz(wallet2priv) != 0 && bits256_cmp(wallet2priv,GENESIS_PRIVKEY) != 0);
    if ( first == 0 && second == 0 && passphrase != 0 && fname2fa != 0 )
    {
        if ( passphrase[0] == 0 && fname2fa[0] == 0 )
            SuperNET_userkeys(passphrase,passsize,fname2fa,fnamesize);
        wallethash = SuperNET_linehash(passphrase);
        SuperNET_linehash(fname2fa); // maps special chars
        wallet2priv = SuperNET_wallet2priv(fname2fa,wallethash);
        //char str[65],str2[65]; printf("(%s + %s) -> wallethash.%s 2.(%s)\n",passphrase,fname2fa,bits256_str(str,wallethash),bits256_str(str2,wallet2priv));
   }
    first = (bits256_nonz(wallethash) != 0 && bits256_cmp(wallethash,GENESIS_PRIVKEY) != 0);
    second = (bits256_nonz(wallet2priv) != 0 && bits256_cmp(wallet2priv,GENESIS_PRIVKEY) != 0);
    if ( first != 0 || second != 0 )
    {
        if ( bits256_nonz(wallethash) == 0 )
            wallethash = GENESIS_PRIVKEY;
        wallet2shared = SuperNET_wallet2shared(wallethash,wallet2priv);
        wallet2pub = curve25519(wallet2shared,curve25519_basepoint9());
        sprintf(fname,"confs/%s",bits256_str(str,wallet2pub));
        //printf("fname.(%s) wallet2shared.%s\n",fname,bits256_str(str,wallet2pub));
        if ( (confstr= OS_filestr(&allocsize,fname)) != 0 )
        {
            if ( (filejson= cJSON_Parse(confstr)) != 0 )
            {
                if ( (deciphered= SuperNET_decipher(0,0,0,0,wallet2shared,curve25519(wallethash,curve25519_basepoint9()),jstr(filejson,"result"))) != 0 )
                {
                    if ( (json= cJSON_Parse(deciphered)) == 0 )
                        printf("cant decipher (%s) [%s]\n",fname,confstr);
                    else
                    {
                        if ( (msgjson= cJSON_Parse(jstr(json,"message"))) == 0 )
                            printf("no message in (%s)\n",jprint(json,0));
                    }
                    free(deciphered);
                }
                free_json(filejson);
            }
        } else printf("couldnt load (%s)\n",fname);
    }
    else
    {
        sprintf(fname,"confs/iguana.conf");
        if ( (confstr= OS_filestr(&allocsize,fname)) != 0 )
        {
            if ( (json= cJSON_Parse(confstr)) != 0 )
                msgjson = json;
        } else printf("couldnt open (%s)\n",fname);
    }
    if ( msgjson != 0 )
        msgjson = jduplicate(msgjson);
    if ( json != 0 )
        free_json(json);
    return(msgjson);
}

int32_t _SuperNET_encryptjson(char *destfname,char *passphrase,int32_t passsize,char *fname2fa,int32_t fnamesize,cJSON *argjson)
{
    bits256 wallethash,wallet2priv,wallet2shared,wallet2pub; char str[65];
    wallethash = wallet2priv = GENESIS_PRIVKEY;
    if ( passphrase == 0 || passphrase[0] == 0 || fname2fa == 0 || fname2fa[0] == 0 )
        SuperNET_userkeys(passphrase,passsize,fname2fa,fnamesize);
    wallethash = SuperNET_linehash(passphrase);
    SuperNET_linehash(fname2fa); // maps special chars
    wallet2priv = SuperNET_wallet2priv(fname2fa,wallethash);
    char str2[65]; printf("ENCRYPT.[%s %s] (%s) 2.%s\n",passphrase,fname2fa,bits256_str(str,wallethash),bits256_str(str2,wallet2priv));
    wallet2shared = SuperNET_wallet2shared(wallethash,wallet2priv);
    wallet2pub = curve25519(wallet2shared,curve25519_basepoint9());
    sprintf(destfname,"confs/%s",bits256_str(str,wallet2pub));
    //printf("shared.%llx -> pub.%s\n",(long long)wallet2shared.txid,bits256_str(str,wallet2pub));
    SuperNET_savejsonfile(destfname,wallethash,wallet2pub,argjson);
    return(0);
}

void SuperNET_setkeys(struct supernet_info *myinfo,void *pass,int32_t passlen,int32_t dosha256)
{
    char pubkeystr[128]; uint8_t pubkey33[33]; bits256 hash;
    if ( dosha256 != 0 )
    {
        memcpy(myinfo->secret,pass,passlen+1);
        myinfo->myaddr.nxt64bits = conv_NXTpassword(myinfo->persistent_priv.bytes,myinfo->myaddr.persistent.bytes,pass,passlen);
    }
    else
    {
        myinfo->myaddr.persistent = curve25519(myinfo->persistent_priv,curve25519_basepoint9());
        init_hexbytes_noT(myinfo->secret,myinfo->persistent_priv.bytes,sizeof(myinfo->persistent_priv));
        vcalc_sha256(0,hash.bytes,myinfo->myaddr.persistent.bytes,32);
        myinfo->myaddr.nxt64bits = hash.txid;
    }
    RS_encode(myinfo->myaddr.NXTADDR,myinfo->myaddr.nxt64bits);
    btc_priv2pub(pubkey33,myinfo->persistent_priv.bytes);
    init_hexbytes_noT(pubkeystr,pubkey33,33);
    btc_coinaddr(myinfo->myaddr.BTC,0,pubkeystr);
    btc_coinaddr(myinfo->myaddr.BTCD,60,pubkeystr);
}

void SuperNET_parsemyinfo(struct supernet_info *myinfo,cJSON *msgjson)
{
    char *ipaddr,*secret,str[65]; bits256 checkhash;
    if ( msgjson != 0 )
    {
        if ( (ipaddr= jstr(msgjson,"ipaddr")) != 0 && is_ipaddr(ipaddr) != 0 )
            strcpy(myinfo->ipaddr,ipaddr);
        if ( (secret= jstr(msgjson,"passphrase")) != 0 )
            SuperNET_setkeys(myinfo,secret,(int32_t)strlen(secret),1);
        else
        {
            myinfo->persistent_priv = jbits256(msgjson,"persistent_priv");
            SuperNET_setkeys(myinfo,myinfo->persistent_priv.bytes,sizeof(myinfo->persistent_priv),0);
            if ( bits256_nonz(myinfo->persistent_priv) == 0 )
            {
                printf("null persistent_priv? generate new one\n");
                OS_randombytes(myinfo->persistent_priv.bytes,sizeof(myinfo->privkey));
            }
            myinfo->myaddr.persistent = jbits256(msgjson,"persistent_pub");
            checkhash = curve25519(myinfo->persistent_priv,curve25519_basepoint9());
        }
        if ( memcmp(checkhash.bytes,myinfo->myaddr.persistent.bytes,sizeof(checkhash)) != 0 )
        {
            printf("persistent pubkey mismatches one in iguana.conf\n");
            myinfo->myaddr.persistent = checkhash;
        } else printf("persistent VALIDATED persistentpub.(%s)\n",bits256_str(str,checkhash));
    }
    if ( bits256_nonz(myinfo->persistent_priv) == 0 )
        OS_randombytes(myinfo->persistent_priv.bytes,sizeof(myinfo->persistent_priv));
    SuperNET_setkeys(myinfo,myinfo->persistent_priv.bytes,sizeof(myinfo->persistent_priv),0);
}

char *SuperNET_keysinit(struct supernet_info *myinfo,char *argjsonstr)
{
    long allocsize; cJSON *msgjson,*json=0; uint32_t r; bits256 wallethash,wallet2priv; int32_t len,c;
    char str[65],str2[65],destfname[1024],fname2fa[2048],passphrase[8192],*ipaddr,*coinargs=0;
    passphrase[0] = fname2fa[0] = 0;
    wallethash = wallet2priv = GENESIS_PRIVKEY;
    coinargs = SuperNET_parsemainargs(myinfo,&wallethash,&wallet2priv,argjsonstr);
    //printf("wallethash.%s 2.(%s)\n",bits256_str(str,wallethash),bits256_str(str2,wallet2priv));
    if ( (msgjson= SuperNET_decryptedjson(passphrase,sizeof(passphrase),wallethash,fname2fa,sizeof(fname2fa),wallet2priv)) != 0 )
    {
        SuperNET_parsemyinfo(myinfo,msgjson);
        free_json(msgjson);
    }
    else
    {
        if ( bits256_nonz(myinfo->persistent_priv) == 0 )
        {
            OS_randombytes(myinfo->persistent_priv.bytes,sizeof(myinfo->persistent_priv));
            myinfo->myaddr.persistent = curve25519(myinfo->persistent_priv,curve25519_basepoint9());
        }
        json = cJSON_CreateObject();
        jaddstr(json,"ipaddr",myinfo->ipaddr);
        jaddbits256(json,"persistent_priv",myinfo->persistent_priv);
        jaddbits256(json,"persistent_pub",myinfo->myaddr.persistent);
        OS_randombytes((void *)&r,sizeof(r));
        jadd64bits(json,"rand",r);
        //printf("call SuperNET_encryptjson\n");
        _SuperNET_encryptjson(destfname,passphrase,sizeof(passphrase),fname2fa,sizeof(fname2fa),json);
        //printf("save.(%s)\n",jprint(json,0));
        free_json(json);
    }
    if ( myinfo->ipaddr[0] == 0 )
    {
        if ( (ipaddr= OS_filestr(&allocsize,"ipaddr")) != 0 )
        {
            printf("got ipaddr.(%s)\n",ipaddr);
            len = (int32_t)strlen(ipaddr) - 1;
            while ( len > 8 && ((c= ipaddr[len]) == '\r' || c == '\n' || c == ' ' || c == '\t') )
                ipaddr[len] = 0, len--;
            printf("got ipaddr.(%s) %x\n",ipaddr,is_ipaddr(ipaddr));
            if ( is_ipaddr(ipaddr) != 0 )
            {
                strcpy(myinfo->ipaddr,ipaddr);
                myinfo->myaddr.selfipbits = (uint32_t)calc_ipbits(ipaddr);
            }
            free(ipaddr);
        }
    }
    if ( myinfo->myaddr.selfipbits == 0 )
    {
        strcpy(myinfo->ipaddr,"127.0.0.1");
        myinfo->myaddr.selfipbits = (uint32_t)calc_ipbits(myinfo->ipaddr);
    }
    OS_randombytes(myinfo->privkey.bytes,sizeof(myinfo->privkey));
    myinfo->myaddr.pubkey = curve25519(myinfo->privkey,curve25519_basepoint9());
    printf("(%s) %s %llu session(%s %s) persistent.%llx %llx\n",myinfo->ipaddr,myinfo->myaddr.NXTADDR,(long long)myinfo->myaddr.nxt64bits,bits256_str(str,myinfo->privkey),bits256_str(str2,myinfo->myaddr.pubkey),(long long)myinfo->persistent_priv.txid,(long long)myinfo->myaddr.persistent.txid);
    return(coinargs);
}

#include "../includes/iguana_apidefs.h"
#include "../includes/iguana_apideclares.h"

THREE_STRINGS(SuperNET,encryptjson,password,permanentfile,anything)
{
    char destfname[4096],pass[8192],fname2[1023]; cJSON *argjson,*retjson = cJSON_CreateObject();
    safecopy(pass,password,sizeof(pass));
    safecopy(fname2,permanentfile,sizeof(fname2));
    argjson = jduplicate(json);
    //printf("argjson.(%s)\n",jprint(argjson,0));
    jdelete(argjson,"agent");
    jdelete(argjson,"method");
    jdelete(argjson,"password");
    jdelete(argjson,"permanentfile");
    jdelete(argjson,"timestamp");
    jdelete(argjson,"tag");
    if ( _SuperNET_encryptjson(destfname,pass,sizeof(pass),fname2,sizeof(fname2),argjson) == 0 )
    {
        jaddstr(retjson,"result","success");
        jaddstr(retjson,"filename",destfname);
    } else jaddstr(retjson,"error","couldnt encrypt json file");
    free_json(argjson);
    return(jprint(retjson,1));
}

TWO_STRINGS(SuperNET,decryptjson,password,permanentfile)
{
    char pass[8192],fname2[1023]; cJSON *retjson,*obj; bits256 wallethash,wallet2priv;
    safecopy(pass,password,sizeof(pass));
    safecopy(fname2,permanentfile,sizeof(fname2));
    wallethash = wallet2priv = GENESIS_PRIVKEY;
    if ( strlen(pass) == sizeof(wallethash)*2 && is_hexstr(pass,(int32_t)sizeof(bits256)*2) > 0 )
        wallethash = bits256_conv(pass);
    if ( strlen(fname2) == sizeof(wallet2priv)*2 && is_hexstr(fname2,(int32_t)sizeof(bits256)*2) > 0 )
        wallet2priv = bits256_conv(fname2);
    //printf("decrypt.(%s %s)\n",pass,fname2);
    if ( (retjson= SuperNET_decryptedjson(pass,sizeof(pass),wallethash,fname2,sizeof(fname2),wallet2priv)) != 0 )
    {
        obj = jduplicate(jobj(retjson,"anything"));
        jdelete(retjson,"anything");
        jadd(retjson,"result",obj);
        return(jprint(retjson,1));
    }
    else return(clonestr("{\"error\":\"couldnt decrypt json file\"}"));
}
#include "../includes/iguana_apiundefs.h"


