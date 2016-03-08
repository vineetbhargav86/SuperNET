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

// selftest supports against allpairs list

#include "exchanges777.h"

struct instantdex_stateinfo *BTC_states; int32_t BTC_numstates;

int64_t instantdex_BTCsatoshis(int64_t price,int64_t volume)
{
    if ( volume > price )
        return(price * dstr(volume));
    else return(dstr(price) * volume);
}

int64_t instantdex_insurance(struct iguana_info *coin,int64_t amount)
{
    return(amount * INSTANTDEX_INSURANCERATE + coin->chain->txfee); // insurance prevents attack
}

void instantdex_swapfree(struct instantdex_accept *A,struct bitcoin_swapinfo *swap)
{
    if ( A != 0 )
        free(A);
    if ( swap != 0 )
    {
        if ( swap->deposit != 0 )
            free(swap->deposit);
        if ( swap->payment != 0 )
            free(swap->payment);
        if ( swap->altpayment != 0 )
            free(swap->altpayment);
        if ( swap->myfee != 0 )
            free(swap->myfee);
        if ( swap->otherfee != 0 )
            free(swap->otherfee);
    }
}

cJSON *instantdex_defaultprocess(struct supernet_info *myinfo,struct exchange_info *exchange,struct bitcoin_swapinfo *swap,cJSON *argjson,cJSON *newjson,uint8_t **serdatap,int32_t *serdatalenp)
{
    uint8_t *serdata = *serdatap; int32_t serdatalen = *serdatalenp;
    *serdatap = 0, *serdatalenp = 0;
    if ( serdata != 0 && serdatalen > 0 )
    {
        serdata[serdatalen-1] = 0;
    }
    return(newjson);
}
//({"agent":"iguana","method":"addcoin","newcoin":"PPC","active":1,"maxpeers":128,"services":0,"poll":1,"RAM":4,"minoutput":100000,"minconfirms":3,"estblocktime":600,"path":"/data/ppcoin","conf":"/data/.ppcoin","txfee_satoshis":100000,"useaddmultisig":1,"hastimestamp":0,"userhome":"/data/SuperNET/iguana","pubval":"37","scriptval":"75","wiftype":"b7","netmagic":"e6e8e9e5","genesishash":"00000ffd590b1485b3caadc19b22e6379c733355108f107a430458cdf3407ab6","genesis":{"hashalgo":"sha256","version":1,"timestamp":1345084287,"nbits":"1d00ffff","nonce":2179302059,"merkleroot":"3c2d8f85fab4d17aac558cc648a1a58acff0de6deb890c29985690052c5993c2"},"p2p":9901,"rpc":9902})
cJSON *instantdex_defaulttimeout(struct supernet_info *myinfo,struct exchange_info *exchange,struct bitcoin_swapinfo *swap,cJSON *argjson,cJSON *newjson,uint8_t **serdatap,int32_t *serdatalenp)
{
    uint8_t *serdata = *serdatap; int32_t serdatalen = *serdatalenp;
    *serdatap = 0, *serdatalenp = 0;
    if ( serdata != 0 && serdatalen > 0 )
    {
        serdata[serdatalen-1] = 0;
    }
    return(newjson);
}

struct instantdex_stateinfo instantdex_errorstate = { "error", 0,0, instantdex_defaultprocess, instantdex_defaulttimeout };
struct instantdex_stateinfo instantdex_timeoutstate = { "timeout", 1,0, instantdex_defaultprocess, instantdex_defaulttimeout };

struct instantdex_stateinfo *instantdex_statefind(struct instantdex_stateinfo *states,int32_t numstates,char *statename)
{
    int32_t i; struct instantdex_stateinfo *state = 0;
    if ( states != 0 && statename != 0 && numstates > 0 )
    {
        for (i=0; i<numstates; i++)
        {
            if ( (state= &states[i]) != 0 && strcmp(state->name,statename) == 0 )
                return(state);
        }
    }
    return(0);
}

void instantdex_stateinit(struct instantdex_stateinfo *states,int32_t numstates,struct instantdex_stateinfo *state,char *name,char *errorstr,char *timeoutstr,void *process_func,void *timeout_func)
{
    struct instantdex_stateinfo *timeoutstate,*errorstate;
    memset(state,0,sizeof(*state));
    strcpy(state->name,name);
    if ( (errorstate= instantdex_statefind(states,numstates,errorstr)) == 0 )
        errorstate = &instantdex_errorstate;
    state->errorind = errorstate->ind;
    if ( (timeoutstate= instantdex_statefind(states,numstates,timeoutstr)) == 0 )
        timeoutstate = &instantdex_timeoutstate;
    else printf("TS.%s ",timeoutstr);
    state->timeoutind = timeoutstate->ind;
    if ( (state->process= process_func) == 0 )
        state->process = instantdex_defaultprocess;
    if ( (state->timeout= timeout_func) == 0 )
        state->timeout = instantdex_defaulttimeout;
}

struct instantdex_stateinfo *instantdex_statecreate(struct instantdex_stateinfo *states,int32_t *numstatesp,char *name,cJSON *(*process_func)(struct supernet_info *myinfo,struct exchange_info *exchange,struct bitcoin_swapinfo *swap,cJSON *argjson,cJSON *newjson,uint8_t **serdatap,int32_t *serdatalenp),cJSON *(*timeout_func)(struct supernet_info *myinfo,struct exchange_info *exchange,struct bitcoin_swapinfo *swap,cJSON *argjson,cJSON *newjson,uint8_t **serdatap,int32_t *serdatalenp),char *timeoutstr,char *errorstr,int32_t initialstate)
{
    struct instantdex_stateinfo S,*state = 0;
    if ( (state= instantdex_statefind(states,*numstatesp,name)) == 0 )
    {
        states = realloc(states,sizeof(*states) * (*numstatesp + 1));
        state = &states[*numstatesp];
        instantdex_stateinit(states,*numstatesp,state,name,errorstr,timeoutstr,process_func,timeout_func);
        state->initialstate = initialstate;
        printf("STATES[%d] %s %p %p %d %d\n",*numstatesp,state->name,state->process,state->timeout,state->timeoutind,state->errorind);
        state->ind = (*numstatesp)++;
    }
    else
    {
        instantdex_stateinit(states,*numstatesp,&S,name,errorstr,timeoutstr,process_func,timeout_func);
        S.ind = state->ind;
        S.initialstate = initialstate;
        if ( memcmp(&S,state,sizeof(S) - sizeof(void *) - sizeof(int)) != 0 )
        {
            int32_t i;
            for (i=0; i<sizeof(S); i++)
                printf("%02x ",((uint8_t *)&S)[i]);
            printf("S\n");
            for (i=0; i<sizeof(S); i++)
                printf("%02x ",((uint8_t *)state)[i]);
            printf("state\n");
            printf("%s %p %p %d %d vs %s %p %p %d %d\n",state->name,state->process,state->timeout,state->timeoutind,state->errorind,S.name,S.process,S.timeout,S.timeoutind,S.errorind);
            printf("statecreate error!!! (%s) already exists\n",name);
        }
    }
    return(states);
}

struct instantdex_event *instantdex_addevent(struct instantdex_stateinfo *states,int32_t numstates,char *statename,char *cmdstr,char *sendcmd,char *nextstatename)
{
    struct instantdex_stateinfo *nextstate,*state;
    if ( (state= instantdex_statefind(states,numstates,statename)) != 0 && (nextstate= instantdex_statefind(states,numstates,nextstatename)) != 0 )
    {
        if ( (state->events= realloc(state->events,(state->numevents + 1) * sizeof(*state->events))) != 0 )
        {
            memset(&state->events[state->numevents],0,sizeof(state->events[state->numevents]));
            strcpy(state->events[state->numevents].cmdstr,cmdstr);
            if ( sendcmd != 0 )
                strcpy(state->events[state->numevents].sendcmd,sendcmd);
            state->events[state->numevents].nextstateind = nextstate->ind;
            state->numevents++;
        }
        return(state->events);
    }
    else
    {
        int32_t i;
        for (i=0; i<numstates; i++)
            printf("%s[%d] ",states[i].name,i);
        printf("cant add event (%s -> %s) without existing state and nextstate\n",statename,nextstatename);
        exit(-1);
        return(0);
    }
}

double instantdex_FSMtest(struct instantdex_stateinfo *states,int32_t numstates,int32_t maxiters)
{
    int32_t i,most,r,r2,n,m=0,initials[100],nextstate=-1;
    struct instantdex_stateinfo *state; struct instantdex_event *event; double sum = 0.;
    if ( maxiters < 1 )
        maxiters = 1;
    for (i=n=most=0; i<numstates; i++)
        if ( states[i].initialstate > 0 )
        {
            printf("initialstate[%d] %d %s\n",i,states[i].initialstate,states[i].name);
            initials[n++] = i;
        }
    if ( n > 0 && n < sizeof(initials)/sizeof(*initials) )
    {
        for (i=0; i<maxiters; i++)
        {
            r = rand() % n;
            state = &states[initials[r]];
            if ( state->name[0] == 0 || state->ind >= numstates )
            {
                printf("illegal state.(%s) %d? ind.%d >= numstates.%d\n",state->name,nextstate,state->ind,numstates);
                break;
            }
            m = 0;
            while ( m++ < 1000 && state->initialstate >= 0 && state->numevents != 0 )
            {
                if ( (i % 1000000) == 0 )
                    fprintf(stderr,"%s ",state->name);
                r2 = rand() % state->numevents;
                event = &state->events[r2];
                if ( (nextstate= event->nextstateind) < 0 )
                    break;
                if ( event->nextstateind >= numstates )
                {
                    printf("nextstateind overflow? %d vs %d\n",event->nextstateind,numstates);
                    break;
                }
                state = &states[event->nextstateind];
            }
            if ( m > most )
                most = m;
            sum += m;
            if ( (i % 1000000) == 0 )
                fprintf(stderr,"reached %s m.%d events most.%d ave %.2f\n",state->name,m,most,sum/(i+1));
        }
    }
    fprintf(stderr," most.%d ave %.2f\n",most,sum/(i+1));
    return(sum / maxiters);
}

cJSON *InstantDEX_argjson(char *reference,char *message,char *othercoinaddr,char *otherNXTaddr,int32_t iter,int32_t val,int32_t val2)
{
    cJSON *argjson = cJSON_CreateObject();
    if ( reference != 0 )
        jaddstr(argjson,"refstr",reference);
    if ( message != 0 && message[0] != 0 )
        jaddstr(argjson,"message",message);
    if ( othercoinaddr != 0 && othercoinaddr[0] != 0 )
        jaddstr(argjson,"othercoinaddr",othercoinaddr);
    if ( otherNXTaddr != 0 && otherNXTaddr[0] != 0 )
        jaddstr(argjson,"otherNXTaddr",otherNXTaddr);
    //jaddbits256(argjson,"basetxid",basetxid);
    //jaddbits256(argjson,"reltxid",reltxid);
    if ( iter != 3 )
    {
        if ( val == 0 )
            val = INSTANTDEX_DURATION;
        jaddnum(argjson,"duration",val);
        jaddnum(argjson,"flags",val2);
    }
    else
    {
        if ( val > 0 )
            jaddnum(argjson,"baseheight",val);
        if ( val2 > 0 )
            jaddnum(argjson,"relheight",val2);
    }
    return(argjson);
}

struct instantdex_msghdr *instantdex_msgcreate(struct supernet_info *myinfo,struct instantdex_msghdr *msg,int32_t datalen)
{
    bits256 otherpubkey; uint64_t signerbits; uint32_t timestamp; uint8_t buf[sizeof(msg->sig)],*data;
    memset(&msg->sig,0,sizeof(msg->sig));
    datalen += (int32_t)(sizeof(*msg) - sizeof(msg->sig));
    data = (void *)((long)msg + sizeof(msg->sig));
    otherpubkey = acct777_msgpubkey(data,datalen);
    timestamp = (uint32_t)time(NULL);
    acct777_sign(&msg->sig,myinfo->privkey,otherpubkey,timestamp,data,datalen);
    //printf("signed datalen.%d allocsize.%d crc.%x\n",datalen,msg->sig.allocsize,calc_crc32(0,data,datalen));
    if ( (signerbits= acct777_validate(&msg->sig,acct777_msgprivkey(data,datalen),msg->sig.pubkey)) != 0 )
    {
        //int32_t i;
        //char str[65],str2[65];
        //for (i=0; i<datalen; i++)
        //    printf("%02x",data[i]);
        //printf(">>>>>>>>>>>>>>>> validated [%ld] len.%d (%s + %s)\n",(long)data-(long)msg,datalen,bits256_str(str,acct777_msgprivkey(data,datalen)),bits256_str(str2,msg->sig.pubkey));
        memset(buf,0,sizeof(buf));
        acct777_rwsig(1,buf,&msg->sig);
        memcpy(&msg->sig,buf,sizeof(buf));
        return(msg);
    } else printf("error validating instantdex msg\n");
    return(0);
}

bits256 instantdex_rwoffer(int32_t rwflag,int32_t *lenp,uint8_t *serialized,struct instantdex_offer *offer)
{
    bits256 orderhash; int32_t len = 0;
    if ( rwflag == 1 )
    {
        vcalc_sha256(0,orderhash.bytes,(void *)offer,sizeof(*offer));
        /*int32_t i;
        for (i=0; i<sizeof(*offer); i++)
            printf("%02x ",((uint8_t *)offer)[i]);
        printf("rwoffer offer\n");*/
    }
    else
    {
        memset(offer,0,sizeof(*offer));
    }
    len += iguana_rwstr(rwflag,&serialized[len],sizeof(offer->base),offer->base);
    len += iguana_rwstr(rwflag,&serialized[len],sizeof(offer->rel),offer->rel);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->price64),&offer->price64);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->basevolume64),&offer->basevolume64);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->offer64),&offer->offer64);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->expiration),&offer->expiration);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->nonce),&offer->nonce);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->myside),&offer->myside);
    len += iguana_rwnum(rwflag,&serialized[len],sizeof(offer->acceptdir),&offer->acceptdir);
    if ( rwflag == 0 )
    {
        vcalc_sha256(0,orderhash.bytes,(void *)offer,sizeof(*offer));
        /*int32_t i;
        for (i=0; i<len; i++)
            printf("%02x ",serialized[i]);
        printf("read rwoffer serialized\n");
        for (i=0; i<sizeof(*offer); i++)
            printf("%02x ",((uint8_t *)offer)[i]);
        printf("rwoffer offer\n");*/
    }
    /*else
    {
        int32_t i;
        for (i=0; i<len; i++)
            printf("%02x ",serialized[i]);
        printf("wrote rwoffer serialized\n");
    }*/
    *lenp = len;
    return(orderhash);
}

char *instantdex_sendcmd(struct supernet_info *myinfo,struct instantdex_offer *offer,cJSON *argjson,char *cmdstr,bits256 desthash,int32_t hops,void *extraser,int32_t extralen)
{
    char *reqstr,*hexstr,*retstr; struct instantdex_msghdr *msg; bits256 instantdexhash,orderhash;
    int32_t i,olen,slen,datalen; uint8_t serialized[sizeof(*offer) + 2]; uint64_t nxt64bits;
    instantdexhash = calc_categoryhashes(0,"InstantDEX",0);
    category_subscribe(myinfo,instantdexhash,GENESIS_PUBKEY);
    jaddstr(argjson,"cmd",cmdstr);
    jaddstr(argjson,"agent","SuperNET");
    jaddstr(argjson,"method","DHT");
    jaddstr(argjson,"handle",myinfo->handle);
    jaddbits256(argjson,"categoryhash",instantdexhash);
    jaddbits256(argjson,"traderpub",myinfo->myaddr.persistent);
    orderhash = instantdex_rwoffer(1,&olen,serialized,offer);
    if ( 1 )
    {
        struct instantdex_offer checkoffer; bits256 checkhash; int32_t checklen;
        checkhash = instantdex_rwoffer(0,&checklen,serialized,&checkoffer);
        if ( checkhash.txid != orderhash.txid )
        {
            for (i=0; i<sizeof(checkoffer); i++)
                printf("%02x ",((uint8_t *)&checkoffer)[i]);
            printf("checklen.%d checktxid.%llu\n",checklen,(long long)checkhash.txid);
        }
    }
    jadd64bits(argjson,"id",orderhash.txid);
    nxt64bits = acct777_nxt64bits(myinfo->myaddr.persistent);
    reqstr = jprint(argjson,0);
    slen = (int32_t)(strlen(reqstr) + 1);
    datalen = (int32_t)slen + extralen + olen;
    msg = calloc(1,datalen + sizeof(*msg));
    for (i=0; i<sizeof(msg->cmd); i++)
        if ( (msg->cmd[i]= cmdstr[i]) == 0 )
            break;
    memcpy(msg->serialized,reqstr,slen);
    memcpy(&msg->serialized[slen],serialized,olen);
    //printf("extralen.%d datalen.%d slen.%d olen.%d\n",extralen,datalen,slen,olen);
    if ( extralen > 0 )
        memcpy(&msg->serialized[slen + olen],extraser,extralen);
    free(reqstr);
    if ( instantdex_msgcreate(myinfo,msg,datalen) != 0 )
    {
        printf(">>>>>>>>>>>> instantdex send.(%s) datalen.%d allocsize.%d crc.%x\n",cmdstr,datalen,msg->sig.allocsize,calc_crc32(0,(void *)((long)msg + 8),datalen-8));
        hexstr = malloc(msg->sig.allocsize*2 + 1);
        init_hexbytes_noT(hexstr,(uint8_t *)msg,msg->sig.allocsize);
        retstr = SuperNET_categorymulticast(myinfo,0,instantdexhash,desthash,hexstr,0,hops,1,argjson,0);
        free_json(argjson), free(hexstr), free(msg);
        return(retstr);
    }
    else
    {
        free_json(argjson), free(msg);
        printf("cant msgcreate datalen.%d\n",datalen);
        return(clonestr("{\"error\":\"couldnt create instantdex message\"}"));
    }
}

int32_t instantdex_updatesources(struct exchange_info *exchange,struct exchange_quote *sortbuf,int32_t n,int32_t max,int32_t ind,int32_t dir,struct exchange_quote *quotes,int32_t numquotes)
{
    int32_t i; struct exchange_quote *quote;
    //printf("instantdex_updatesources update dir.%d numquotes.%d\n",dir,numquotes);
    for (i=0; i<numquotes; i++)
    {
        quote = &quotes[i << 1];
        //printf("n.%d ind.%d i.%d dir.%d price %.8f vol %.8f\n",n,ind,i,dir,quote->price,quote->volume);
        if ( quote->price > SMALLVAL )
        {
            sortbuf[n] = *quote;
            sortbuf[n].val = ind;
            sortbuf[n].exchangebits = exchange->exchangebits;
            //printf("sortbuf[%d] <-\n",n*2);
            if ( ++n >= max )
                break;
        }
    }
    return(n);
}

double instantdex_aveprice(struct supernet_info *myinfo,struct exchange_quote *sortbuf,int32_t max,double *totalvolp,char *base,char *rel,double basevolume,cJSON *argjson)
{
    char *str; double totalvol,pricesum; uint32_t timestamp;
    struct exchange_quote quote; int32_t i,n,dir,num,depth = 100;
    struct exchange_info *exchange; struct exchange_request *req,*active[64];
    timestamp = (uint32_t)time(NULL);
    if ( basevolume < 0. )
        basevolume = -basevolume, dir = -1;
    else dir = 1;
    memset(sortbuf,0,sizeof(*sortbuf) * max);
    if ( base != 0 && rel != 0 && basevolume > SMALLVAL )
    {
        for (i=num=0; i<myinfo->numexchanges && num < sizeof(active)/sizeof(*active); i++)
        {
            if ( (exchange= myinfo->tradingexchanges[i]) != 0 )
            {
                if ( (req= exchanges777_baserelfind(exchange,base,rel,'M')) == 0 )
                {
                    if ( (str= exchanges777_Qprices(exchange,base,rel,30,1,depth,argjson,1,exchange->commission)) != 0 )
                        free(str);
                    req = exchanges777_baserelfind(exchange,base,rel,'M');
                }
                if ( req == 0 )
                {
                    if ( (*exchange->issue.supports)(exchange,base,rel,argjson) != 0 )
                        printf("unexpected null req.(%s %s) %s\n",base,rel,exchange->name);
                }
                else
                {
                    //printf("active.%s\n",exchange->name);
                    active[num++] = req;
                }
            }
        }
        for (i=n=0; i<num; i++)
        {
            if ( dir < 0 && active[i]->numbids > 0 )
                n = instantdex_updatesources(active[i]->exchange,sortbuf,n,max,i,1,active[i]->bidasks,active[i]->numbids);
            else if ( dir > 0 && active[i]->numasks > 0 )
                n = instantdex_updatesources(active[i]->exchange,sortbuf,n,max,i,-1,&active[i]->bidasks[1],active[i]->numasks);
        }
        //printf("dir.%d %s/%s numX.%d n.%d\n",dir,base,rel,num,n);
        if ( dir < 0 )
            revsort64s(&sortbuf[0].satoshis,n,sizeof(*sortbuf));
        else sort64s(&sortbuf[0].satoshis,n,sizeof(*sortbuf));
        for (totalvol=pricesum=i=0; i<n && totalvol < basevolume; i++)
        {
            quote = sortbuf[i];
            //printf("n.%d i.%d price %.8f %.8f %.8f\n",n,i,dstr(sortbuf[i].satoshis),sortbuf[i].price,quote.volume);
            if ( quote.satoshis != 0 )
            {
                pricesum += (quote.price * quote.volume);
                totalvol += quote.volume;
                printf("i.%d of %d %12.8f vol %.8f %s | aveprice %.8f total vol %.8f\n",i,n,sortbuf[i].price,quote.volume,active[quote.val]->exchange->name,pricesum/totalvol,totalvol);
            }
        }
        if ( totalvol > 0. )
        {
            *totalvolp = totalvol;
            return(pricesum / totalvol);
        }
    }
    *totalvolp = 0;
    return(0);
}

double instantdex_avehbla(struct supernet_info *myinfo,double retvals[4],char *base,char *rel,double basevolume)
{
    double avebid,aveask,bidvol,askvol; struct exchange_quote sortbuf[256]; cJSON *argjson;
    argjson = cJSON_CreateObject();
    aveask = instantdex_aveprice(myinfo,sortbuf,sizeof(sortbuf)/sizeof(*sortbuf),&askvol,base,rel,basevolume,argjson);
    avebid = instantdex_aveprice(myinfo,sortbuf,sizeof(sortbuf)/sizeof(*sortbuf),&bidvol,base,rel,-basevolume,argjson);
    free_json(argjson);
    retvals[0] = avebid, retvals[1] = bidvol, retvals[2] = aveask, retvals[3] = askvol;
    if ( avebid > SMALLVAL && aveask > SMALLVAL )
        return((avebid + aveask) * .5);
    else return(0);
}

int32_t instantdex_bidaskdir(struct instantdex_offer *offer)
{
    if ( offer->myside == 0 && offer->acceptdir > 0 ) // base
        return(-1);
    else if ( offer->myside == 1 && offer->acceptdir < 0 ) // rel
        return(1);
    else return(0);
}

cJSON *instantdex_offerjson(struct instantdex_offer *offer,uint64_t orderid)
{
    int32_t dir; cJSON *item = cJSON_CreateObject();
    jadd64bits(item,"orderid",orderid);
    jadd64bits(item,"offerer",offer->offer64);
    if ( (dir= instantdex_bidaskdir(offer)) > 0 )
        jaddstr(item,"type","bid");
    else if ( dir < 0 )
        jaddstr(item,"type","ask");
    else
    {
        jaddstr(item,"type","strange");
        jaddnum(item,"acceptdir",offer->acceptdir);
        jaddnum(item,"myside",offer->myside);
    }
    jaddstr(item,"base",offer->base);
    jaddstr(item,"rel",offer->rel);
    jaddnum(item,"timestamp",offer->expiration);
    jaddnum(item,"price",dstr(offer->price64));
    jaddnum(item,"volume",dstr(offer->basevolume64));
    jaddnum(item,"minperc",offer->minperc);
    jaddnum(item,"nonce",offer->nonce);
    jaddnum(item,"expiresin",offer->expiration - time(NULL));
    return(item);
}

cJSON *instantdex_acceptjson(struct instantdex_accept *ap)
{
    cJSON *item = cJSON_CreateObject();
    jadd64bits(item,"orderid",ap->orderid);
    jaddnum(item,"pendingvolume",dstr(ap->pendingvolume64));
    if ( ap->dead != 0 )
        jadd64bits(item,"dead",ap->dead);
    jadd(item,"offer",instantdex_offerjson(&ap->offer,ap->orderid));
    return(item);
}

void instantdex_statetxjson(cJSON *array,char *name,struct bitcoin_statetx *tx)
{
    cJSON *item;
    if ( tx != 0 )
    {
        item = cJSON_CreateObject();
        jaddbits256(item,"txid",tx->txid);
        jaddnum(item,"inputsum",dstr(tx->inputsum));
        jaddnum(item,"amount",dstr(tx->amount));
        jaddnum(item,"change",dstr(tx->change));
        jaddnum(item,"txfee",dstr(tx->inputsum) - dstr(tx->amount) - dstr(tx->change));
        jaddnum(item,"confirms",dstr(tx->numconfirms));
        jaddstr(item,"destaddr",tx->destaddr);
        jaddstr(item,"txbytes",tx->txbytes);
        jadd(array,name,item);
    }
}

cJSON *instantdex_statemachinejson(struct bitcoin_swapinfo *swap)
{
    cJSON *retjson,*txs; int32_t isbob,mydir,otherdir;
    retjson = cJSON_CreateObject();
    if ( swap != 0 )
    {
        mydir = instantdex_bidaskdir(&swap->mine.offer);
        otherdir = instantdex_bidaskdir(&swap->other.offer);
        isbob = instantdex_isbob(swap);
        jaddnum(retjson,"isbob",isbob);
        jaddnum(retjson,"mydir",mydir);
        jaddnum(retjson,"otherdir",otherdir);
        jaddnum(retjson,"expiration",swap->expiration);
        jaddnum(retjson,"insurance",dstr(swap->insurance));
        jaddnum(retjson,"baseamount",dstr(swap->altsatoshis));
        jaddnum(retjson,"BTCamount",dstr(swap->BTCsatoshis));
        jaddnum(retjson,"expiration",swap->expiration);
        if ( swap->dead != 0 )
            jadd64bits(retjson,"dead",swap->dead);
        jaddbits256(retjson,"privAm",swap->privAm);
        jaddbits256(retjson,"pubAm",swap->pubAm);
        jaddbits256(retjson,"privBn",swap->privBn);
        jaddbits256(retjson,"pubBn",swap->pubBn);

        jaddbits256(retjson,"myorderhash",swap->myorderhash);
        jaddnum(retjson,"choosei",swap->choosei);
        jaddnum(retjson,"cutverified",swap->cutverified);
        jaddbits256(retjson,"othertrader",swap->othertrader);
        jaddbits256(retjson,"otherorderhash",swap->otherorderhash);
        jaddnum(retjson,"otherchoosei",swap->otherchoosei);
        jaddnum(retjson,"otherverifiedcut",swap->otherverifiedcut);
        if ( isbob == 0 )
        {
            jaddbits256(retjson,"pubA0",swap->mypubs[0]);
            jaddbits256(retjson,"pubA1",swap->mypubs[1]);
            jaddbits256(retjson,"pubB0",swap->otherpubs[0]);
            jaddbits256(retjson,"pubB1",swap->otherpubs[1]);
        }
        else
        {
            jaddbits256(retjson,"pubB0",swap->mypubs[0]);
            jaddbits256(retjson,"pubB1",swap->mypubs[1]);
            jaddbits256(retjson,"pubA0",swap->otherpubs[0]);
            jaddbits256(retjson,"pubA1",swap->otherpubs[1]);
        }
        if ( mydir > 0 && otherdir < 0 )
        {
            jadd64bits(retjson,"bidid",swap->mine.orderid);
            jadd64bits(retjson,"askid",swap->other.orderid);
        }
        else if ( mydir < 0 && otherdir > 0 )
        {
            jadd64bits(retjson,"askid",swap->mine.orderid);
            jadd64bits(retjson,"bidid",swap->other.orderid);
        }
        if ( swap->matched64 == swap->mine.orderid )
        {
            jadd(retjson,"initiator",instantdex_acceptjson(&swap->other));
            jadd(retjson,"matched",instantdex_acceptjson(&swap->mine));
        }
        else if ( swap->matched64 == swap->other.orderid )
        {
            jadd(retjson,"initiator",instantdex_acceptjson(&swap->mine));
            jadd(retjson,"matched",instantdex_acceptjson(&swap->other));
        }
        else jaddstr(retjson,"initiator","illegal initiator missing");
        if ( swap->state != 0 )
            jaddstr(retjson,"state",swap->state->name);
        txs = cJSON_CreateObject();
        instantdex_statetxjson(txs,"deposit",swap->deposit);
        instantdex_statetxjson(txs,"payment",swap->payment);
        instantdex_statetxjson(txs,"altpayment",swap->altpayment);
        instantdex_statetxjson(txs,"myfee",swap->myfee);
        instantdex_statetxjson(txs,"otherfee",swap->otherfee);
        jadd(retjson,"txs",txs);
        jaddstr(retjson,"status",swap->status);
    }
    return(retjson);
}

cJSON *instantdex_historyjson(struct bitcoin_swapinfo *swap)
{
    // need to make sure accepts are put onto history queue when they are completed or deaded
    // also to make permanent copy (somewhere)
    return(instantdex_statemachinejson(swap));
}

struct bitcoin_swapinfo *instantdex_historyfind(struct supernet_info *myinfo,struct exchange_info *exchange,uint64_t orderid)
{
    struct bitcoin_swapinfo PAD,*swap,*retswap = 0; uint32_t now;
    now = (uint32_t)time(NULL);
    memset(&PAD,0,sizeof(PAD));
    queue_enqueue("historyQ",&exchange->historyQ,&PAD.DL,0);
    while ( (swap= queue_dequeue(&exchange->historyQ,0)) != 0 && swap != &PAD )
    {
        if ( orderid == swap->mine.orderid )
            retswap = swap;
        queue_enqueue("historyQ",&exchange->historyQ,&swap->DL,0);
    }
    return(retswap);
}

struct bitcoin_swapinfo *instantdex_statemachinefind(struct supernet_info *myinfo,struct exchange_info *exchange,uint64_t orderid,int32_t requeueflag)
{
    struct bitcoin_swapinfo PAD,*swap,*retswap = 0; uint32_t now;
    now = (uint32_t)time(NULL);
    memset(&PAD,0,sizeof(PAD));
    queue_enqueue("statemachineQ",&exchange->statemachineQ,&PAD.DL,0);
    while ( (swap= queue_dequeue(&exchange->statemachineQ,0)) != 0 && swap != &PAD )
    {
        if ( now < swap->expiration && swap->mine.dead == 0 && swap->other.dead == 0 )
        {
            if ( orderid == swap->mine.orderid || orderid == swap->other.orderid )
            {
                if ( retswap != 0 && requeueflag == 0 )
                    queue_enqueue("statemachineQ",&exchange->statemachineQ,&retswap->DL,0);
                retswap = swap;
            }
        }
        else
        {
            strcpy(swap->status,"expired");
            printf("expired pending, need to take action, send timeout event\n");
            queue_enqueue("historyQ",&exchange->historyQ,&swap->DL,0);
            continue;
        }
        if ( swap != retswap || requeueflag != 0 )
            queue_enqueue("statemachineQ",&exchange->statemachineQ,&swap->DL,0);
    }
    //printf("found statemachine.%p\n",retswap);
    return(retswap);
}

struct instantdex_accept *instantdex_offerfind(struct supernet_info *myinfo,struct exchange_info *exchange,cJSON *bids,cJSON *asks,uint64_t orderid,char *base,char *rel,int32_t requeue)
{
    struct instantdex_accept PAD,*ap,*retap = 0; uint32_t now; cJSON *item,*offerobj; char *type;
    now = (uint32_t)time(NULL);
    memset(&PAD,0,sizeof(PAD));
    queue_enqueue("acceptableQ",&exchange->acceptableQ,&PAD.DL,0);
    while ( (ap= queue_dequeue(&exchange->acceptableQ,0)) != 0 && ap != &PAD )
    {
        if ( now < ap->offer.expiration && ap->dead == 0 )
        {
            //printf("%d %d find cmps %d %d %d %d %d %d me.%llu vs %llu o.%llu | vs %llu\n",instantdex_bidaskdir(&ap->offer),ap->offer.expiration-now,strcmp(base,"*") == 0,strcmp(base,ap->offer.base) == 0,strcmp(rel,"*") == 0,strcmp(rel,ap->offer.rel) == 0,orderid == 0,orderid == ap->orderid,(long long)myinfo->myaddr.nxt64bits,(long long)ap->offer.offer64,(long long)ap->orderid,(long long)orderid);
            if ( (strcmp(base,"*") == 0 || strcmp(base,ap->offer.base) == 0) && (strcmp(rel,"*") == 0 || strcmp(rel,ap->offer.rel) == 0) && (orderid == 0 || orderid == ap->orderid) )
            {
                if ( requeue == 0 && retap != 0 )
                    queue_enqueue("acceptableQ",&exchange->acceptableQ,&retap->DL,0);
                retap = ap;
            }
            if ( (item= instantdex_acceptjson(ap)) != 0 )
            {
                //printf("item.(%s)\n",jprint(item,0));
                if ( (offerobj= jobj(item,"offer")) != 0 && (type= jstr(offerobj,"type")) != 0 )
                {
                    if ( strcmp(type,"bid") == 0 && bids != 0 )
                        jaddi(bids,jduplicate(offerobj));
                    else if ( strcmp(type,"ask") == 0 && asks != 0 )
                        jaddi(asks,jduplicate(offerobj));
                }
                free_json(item);
            } else printf("error generating acceptjson.%llu\n",(long long)ap->orderid);
            if ( ap != retap || requeue != 0 )
            {
                //printf("requeue.%p\n",ap);
                queue_enqueue("acceptableQ",&exchange->acceptableQ,&ap->DL,0);
            }
        } else free(ap);
    }
    return(retap);
}

struct instantdex_accept *instantdex_acceptable(struct supernet_info *myinfo,struct exchange_info *exchange,struct instantdex_accept *A,double minperc)
{
    struct instantdex_accept PAD,*ap,*retap = 0; double aveprice;//,retvals[4];
    uint64_t minvol,bestprice64 = 0; uint32_t now; int32_t offerdir;
    aveprice = 0;//instantdex_avehbla(myinfo,retvals,A->offer.base,A->offer.rel,dstr(A->offer.basevolume64));
    now = (uint32_t)time(NULL);
    memset(&PAD,0,sizeof(PAD));
    queue_enqueue("acceptableQ",&exchange->acceptableQ,&PAD.DL,0);
    offerdir = instantdex_bidaskdir(&A->offer);
    minvol = (A->offer.basevolume64 * minperc * .01);
    printf("offerdir.%d (%s/%s) minperc %.3f minvol %.8f vs %.8f\n",offerdir,A->offer.base,A->offer.rel,minperc,dstr(minvol),dstr(A->offer.basevolume64));
    while ( (ap= queue_dequeue(&exchange->acceptableQ,0)) != 0 && ap != &PAD )
    {
        if ( now > ap->offer.expiration || ap->dead != 0 || A->offer.offer64 == ap->offer.offer64 )
        {
            //printf("now.%u skip expired %u/dead.%u or my order orderid.%llu from %llu\n",now,ap->offer.expiration,ap->dead,(long long)ap->orderid,(long long)ap->offer.offer64);
        }
        else if ( strcmp(ap->offer.base,A->offer.base) != 0 || strcmp(ap->offer.rel,A->offer.rel) != 0 )
        {
            //printf("skip mismatched.(%s/%s) orderid.%llu from %llu\n",ap->offer.base,ap->offer.rel,(long long)ap->orderid,(long long)ap->offer.offer64);
        }
        else if ( offerdir*instantdex_bidaskdir(&ap->offer) > 0 )
        {
            //printf("skip same direction %d orderid.%llu from %llu\n",instantdex_bidaskdir(&ap->offer),(long long)ap->orderid,(long long)ap->offer.offer64);
        }
        else if ( minvol > ap->offer.basevolume64 - ap->pendingvolume64 )
        {
            //printf("skip too small order %.8f vs %.8f orderid.%llu from %llu\n",dstr(minvol),dstr(ap->offer.basevolume64)-dstr(ap->pendingvolume64),(long long)ap->orderid,(long long)ap->offer.offer64);
        }
        else if ( (offerdir > 0 && ap->offer.price64 > A->offer.price64) || (offerdir < 0 && ap->offer.price64 < A->offer.price64) )
        {
            //printf("skip out of band dir.%d offer %.8f vs %.8f orderid.%llu from %llu\n",offerdir,dstr(ap->offer.price64),dstr(A->offer.price64),(long long)ap->orderid,(long long)ap->offer.offer64);
        }
        else
        {
            if ( bestprice64 == 0 || (offerdir > 0 && ap->offer.price64 < bestprice64) || (offerdir < 0 && ap->offer.price64 > bestprice64) )
            {
                printf(">>>> MATCHED better price dir.%d offer %.8f vs %.8f orderid.%llu from %llu\n",offerdir,dstr(ap->offer.price64),dstr(A->offer.price64),(long long)ap->orderid,(long long)ap->offer.offer64);
                bestprice64 = ap->offer.price64;
                if ( retap != 0 )
                    queue_enqueue("acceptableQ",&exchange->acceptableQ,&retap->DL,0);
                retap = ap;
            }
        }
        if ( ap != retap )
            queue_enqueue("acceptableQ",&exchange->acceptableQ,&ap->DL,0);
        else free(ap);
    }
    return(retap);
}

// NXTrequest:
// sends NXT assetid, volume and desired
// request:
// other node sends (othercoin, othercoinaddr, otherNXT and reftx that expires well before phasedtx)
// proposal:
// NXT node submits phasedtx that refers to it, but it wont confirm
// approve:
// other node verifies unconfirmed has phasedtx and broadcasts cltv, also to NXT node, releases trigger
// confirm:
// NXT node verifies bitcoin txbytes has proper payment and cashes in with onetimepubkey
// BTC* node approves phased tx with onetimepubkey

bits256 instantdex_acceptset(struct instantdex_accept *ap,char *base,char *rel,int32_t duration,int32_t myside,int32_t acceptdir,double price,double volume,uint64_t offerbits,uint32_t nonce,uint8_t minperc)
{
    bits256 hash;
    memset(ap,0,sizeof(*ap));
    safecopy(ap->offer.base,base,sizeof(ap->offer.base));
    safecopy(ap->offer.rel,rel,sizeof(ap->offer.rel));
    if ( nonce == 0 )
        OS_randombytes((uint8_t *)&ap->offer.nonce,sizeof(ap->offer.nonce));
    else ap->offer.nonce = nonce;
    if ( duration < 1000000000 )
        ap->offer.expiration = (uint32_t)time(NULL) + duration;
    else ap->offer.expiration = duration;
    ap->offer.offer64 = offerbits;
    ap->offer.myside = myside;
    ap->offer.acceptdir = acceptdir;
    ap->offer.minperc = minperc;
    ap->offer.price64 = price * SATOSHIDEN;
    ap->offer.basevolume64 = volume * SATOSHIDEN;
    vcalc_sha256(0,hash.bytes,(void *)&ap->offer,sizeof(ap->offer));
    ap->orderid = hash.txid;
    //int32_t i;
    //for (i=0; i<sizeof(ap->offer); i++)
    //    printf("%02x ",((uint8_t *)&ap->offer)[i]);
    //printf("\n(%s/%s) %.8f %.8f acceptdir.%d myside.%d\n",base,rel,price,volume,acceptdir,myside);
    return(hash);
}

int32_t instantdex_acceptextract(struct instantdex_accept *ap,cJSON *argjson)
{
    char *base,*rel; bits256 hash,traderpub; double price,volume; int32_t baserel,acceptdir,minperc;
    memset(ap,0,sizeof(*ap));
    if ( (base= jstr(argjson,"base")) != 0 )
    {
        volume = jdouble(argjson,"volume");
        if ( (minperc= juint(argjson,"minperc")) < INSTANTDEX_MINPERC )
            minperc = INSTANTDEX_MINPERC;
        else if ( minperc > 100 )
            minperc = 100;
        if ( (rel= jstr(argjson,"rel")) != 0 )
            safecopy(ap->offer.rel,rel,sizeof(ap->offer.rel));
        if ( (price= jdouble(argjson,"maxprice")) > SMALLVAL )
        {
            baserel = 1;
            acceptdir = -1;
        }
        else if ( (price= jdouble(argjson,"minprice")) > SMALLVAL )
        {
            baserel = 0;
            acceptdir = 1;
        } else return(-1);
        //printf("price %f vol %f baserel.%d acceptdir.%d\n",price,volume,baserel,acceptdir);
        traderpub = jbits256(argjson,"traderpub");
        hash = instantdex_acceptset(ap,base,rel,INSTANTDEX_LOCKTIME*2,baserel,acceptdir,price,volume,traderpub.txid,0,minperc);
    }
    else
    {
        if ( (base= jstr(argjson,"b")) != 0 )
            safecopy(ap->offer.base,base,sizeof(ap->offer.base));
        if ( (rel= jstr(argjson,"r")) != 0 )
            safecopy(ap->offer.rel,rel,sizeof(ap->offer.rel));
        ap->offer.nonce = juint(argjson,"n");
        ap->offer.expiration = juint(argjson,"e");
        ap->offer.myside = juint(argjson,"s");
        ap->offer.acceptdir = jint(argjson,"d");
        ap->offer.offer64 = j64bits(argjson,"o");
        ap->offer.price64 = j64bits(argjson,"p");
        ap->offer.basevolume64 = j64bits(argjson,"v");
        if ( (ap->offer.minperc= juint(argjson,"m")) < INSTANTDEX_MINPERC )
            ap->offer.minperc = INSTANTDEX_MINPERC;
        vcalc_sha256(0,hash.bytes,(void *)&ap->offer,sizeof(ap->offer));
        ap->orderid = j64bits(argjson,"id");
    }
    if ( hash.txid != ap->orderid )
    {
        int32_t i;
        for (i=0; i<sizeof(*ap); i++)
            printf("%02x ",((uint8_t *)ap)[i]);
        printf("instantdex_acceptextract warning %llu != %llu\n",(long long)hash.txid,(long long)ap->orderid);
        return(-1);
    }
    return(0);
}

#include "swaps/iguana_BTCswap.c"
#include "swaps/iguana_ALTswap.c"
#include "swaps/iguana_NXTswap.c"
#include "swaps/iguana_PAXswap.c"

struct bitcoin_swapinfo *bitcoin_swapinit(struct supernet_info *myinfo,struct exchange_info *exchange,struct instantdex_accept *myap,struct instantdex_accept *otherap,int32_t aminitiator,cJSON *argjson,char *statename)
{
    struct bitcoin_swapinfo *swap = 0; struct iguana_info *coinbtc,*altcoin;
    swap = calloc(1,sizeof(struct bitcoin_swapinfo));
    swap->state = instantdex_statefind(BTC_states,BTC_numstates,statename);
    swap->mine = *myap, swap->other = *otherap;
    if ( (swap->isinitiator= aminitiator) != 0 )
    {
        swap->matched64 = otherap->orderid;
        swap->expiration = otherap->offer.expiration;
    }
    else
    {
        swap->matched64 = myap->orderid;
        swap->expiration = myap->offer.expiration;
    }
    swap->choosei = swap->otherchoosei = -1;
    strcpy(swap->status,"pending");
    vcalc_sha256(0,swap->myorderhash.bytes,(void *)&swap->mine.offer,sizeof(swap->mine.offer));
    vcalc_sha256(0,swap->otherorderhash.bytes,(void *)&swap->other.offer,sizeof(swap->other.offer));
    swap->mypubkey = myinfo->myaddr.persistent;
    swap->othertrader = jbits256(argjson,"traderpub");
    swap->altsatoshis = myap->offer.basevolume64;
    swap->BTCsatoshis = instantdex_BTCsatoshis(myap->offer.price64,myap->offer.basevolume64);
    if ( (coinbtc= iguana_coinfind("BTC")) == 0 || (altcoin= iguana_coinfind(swap->mine.offer.base)) == 0 )
    {
        printf("cant find BTC or %s\n",swap->mine.offer.base);
        return(0);
    }
    swap->insurance = (swap->BTCsatoshis * INSTANTDEX_INSURANCERATE + coinbtc->chain->txfee);
    swap->altpremium = (swap->altsatoshis * INSTANTDEX_INSURANCERATE + altcoin->chain->txfee);
    if ( myap->offer.myside != instantdex_isbob(swap) || otherap->offer.myside == instantdex_isbob(swap) )
    {
        printf("isbob error.(%d %d) %d\n",myap->offer.myside,otherap->offer.myside,instantdex_isbob(swap));
        return(0);
    }
    return(swap);
}

char *instantdex_checkoffer(struct supernet_info *myinfo,uint64_t *txidp,struct exchange_info *exchange,struct instantdex_accept *myap,cJSON *argjson)
{
    char *retstr = 0; struct instantdex_accept *otherap; struct bitcoin_swapinfo *swap; cJSON *newjson; int32_t isbob = 0;
    *txidp = myap->orderid;
    if ( (otherap= instantdex_acceptable(myinfo,exchange,myap,myap->offer.minperc)) == 0 )
    {
        printf("add.%llu to acceptableQ\n",(long long)myap->orderid);
        if ( (retstr= instantdex_sendcmd(myinfo,&myap->offer,argjson,"BTCoffer",GENESIS_PUBKEY,INSTANTDEX_HOPS,0,0)) != 0 )
            free(retstr);
        queue_enqueue("acceptableQ",&exchange->acceptableQ,&myap->DL,0);
        return(jprint(instantdex_offerjson(&myap->offer,myap->orderid),1));
    }
    else
    {
        isbob = myap->offer.myside;
        swap = bitcoin_swapinit(myinfo,exchange,myap,otherap,1,argjson,isbob != 0 ? "BOB_sentoffer" : "ALICE_sentoffer");
        printf("STATEMACHINEQ.(%llu / %llu)\n",(long long)swap->mine.orderid,(long long)swap->other.orderid);
        //queue_enqueue("acceptableQ",&exchange->acceptableQ,&swap->DL,0);
        queue_enqueue("statemachineQ",&exchange->statemachineQ,&swap->DL,0);
        if ( (newjson= instantdex_parseargjson(myinfo,exchange,swap,argjson,1)) == 0 )
            return(clonestr("{\"error\":\"instantdex_checkoffer null newjson\"}"));
        return(instantdex_sendcmd(myinfo,&swap->mine.offer,newjson,"BTCoffer",GENESIS_PUBKEY,INSTANTDEX_HOPS,swap->deck,sizeof(swap->deck)));
    }
    return(retstr);
}

char *instantdex_gotoffer(struct supernet_info *myinfo,struct exchange_info *exchange,struct instantdex_accept *myap,struct instantdex_accept *otherap,struct instantdex_msghdr *msg,cJSON *argjson,char *remoteaddr,uint64_t signerbits,uint8_t *serdata,int32_t serdatalen) // receiving side
{
    struct bitcoin_swapinfo *swap = 0; bits256 traderpub; struct iguana_info *coinbtc,*altcoin; cJSON *newjson=0; char *retstr=0; int32_t isbob;
    coinbtc = iguana_coinfind("BTC");
    traderpub = jbits256(argjson,"traderpub");
    if ( bits256_cmp(traderpub,myinfo->myaddr.persistent) == 0 )
    {
        printf("got my own gotoffer packet orderid.%llu/%llu\n",(long long)myap->orderid,(long long)otherap->orderid);
        return(clonestr("{\"result\":\"got my own packet\"}"));
    }
    if ( 0 )
    {
        int32_t i;
        for (i=0; i<sizeof(otherap->offer); i++)
            printf("%02x ",((uint8_t *)&otherap->offer)[i]);
        printf("gotoffer.%llu\n",(long long)otherap->orderid);
    }
    printf(">>>>>>>>> GOTOFFER T.%d got (%s/%s) %.8f vol %.8f %llu offerside.%d offerdir.%d decksize.%ld/datalen.%d\n",bits256_cmp(traderpub,myinfo->myaddr.persistent),myap->offer.base,myap->offer.rel,dstr(myap->offer.price64),dstr(myap->offer.basevolume64),(long long)myap->orderid,myap->offer.myside,myap->offer.acceptdir,sizeof(swap->deck),serdatalen);
    if ( exchange == 0 )
        return(clonestr("{\"error\":\"instantdex_BTCswap null exchange ptr\"}"));
    if ( (altcoin= iguana_coinfind(myap->offer.base)) == 0 || coinbtc == 0 )
        return(clonestr("{\"error\":\"instantdex_BTCswap cant find btc or other coin info\"}"));
    if ( strcmp(myap->offer.rel,"BTC") != 0 )
        return(clonestr("{\"error\":\"instantdex_BTCswap offer non BTC rel\"}"));
    if ( myap->offer.expiration < (time(NULL) + INSTANTDEX_DURATION) || otherap->offer.expiration < (time(NULL) + INSTANTDEX_DURATION) )
        return(clonestr("{\"error\":\"instantdex_BTCswap offer too close to expiration\"}"));
    isbob = myap->offer.myside;
    swap = bitcoin_swapinit(myinfo,exchange,myap,otherap,0,argjson,isbob != 0 ? "BOB_gotoffer" : "ALICE_gotoffer");
    if ( (newjson= instantdex_parseargjson(myinfo,exchange,swap,argjson,1)) == 0 )
    {
        printf("error parsing argjson\n");
        return(clonestr("{\"error\":\"instantdex_BTCswap offer null newjson\"}"));
    }
    else //if ( (retstr= instantdex_addfeetx(myinfo,newjson,ap,swap,"BOB_gotoffer","ALICE_gotoffer")) == 0 )
    {
        queue_enqueue("acceptableQ",&exchange->acceptableQ,&swap->DL,0);
        queue_enqueue("statemachineQ",&exchange->statemachineQ,&swap->DL,0);
        if ( (retstr= instantdex_choosei(swap,newjson,argjson,serdata,serdatalen)) != 0 )
            return(retstr);
        else
        {
            return(instantdex_sendcmd(myinfo,&swap->mine.offer,newjson,"BTCdeckC",traderpub,INSTANTDEX_HOPS,swap->deck,sizeof(swap->deck)));
        }
    }
    return(retstr);
}

char *instantdex_parse(struct supernet_info *myinfo,struct instantdex_msghdr *msg,cJSON *argjson,char *remoteaddr,uint64_t signerbits,struct instantdex_offer *offer,bits256 orderhash,uint8_t *serdata,int32_t serdatalen)
{
    char cmdstr[16],*retstr; struct exchange_info *exchange; struct instantdex_accept A,*ap = 0; bits256 traderpub; cJSON *newjson; struct bitcoin_swapinfo *swap;
    if ( BTC_states == 0 )
        BTC_states = BTC_initFSM(&BTC_numstates);
    exchange = exchanges777_find("bitcoin");
    memset(cmdstr,0,sizeof(cmdstr)), memcpy(cmdstr,msg->cmd,sizeof(msg->cmd));
    if ( argjson != 0 )
    {
        traderpub = jbits256(argjson,"traderpub");
        memset(&A,0,sizeof(A));
        if ( j64bits(argjson,"id") != orderhash.txid )
        {
            printf("orderhash %llu mismatch id.%llu\n",(long long)orderhash.txid,(long long)j64bits(argjson,"id"));
            return(clonestr("{\"error\":\"orderhash mismatch\"}"));
        }
        A.offer = *offer;
        A.orderid = orderhash.txid;
        printf("got.(%s) for %llu offer64.%llu\n",cmdstr,(long long)A.orderid,(long long)A.offer.offer64);
        if ( (A.offer.minperc= jdouble(argjson,"p")) < INSTANTDEX_MINPERC )
            A.offer.minperc = INSTANTDEX_MINPERC;
        else if ( A.offer.minperc > 100 )
            A.offer.minperc = 100;
        if ( strcmp(cmdstr,"BTCoffer") == 0 ) // incoming
        {
            printf("BTCoffer state\n");
            if ( (ap= instantdex_acceptable(myinfo,exchange,&A,A.offer.minperc)) != 0 )
            {
                if ( (retstr= instantdex_gotoffer(myinfo,exchange,ap,&A,msg,argjson,remoteaddr,signerbits,serdata,serdatalen)) != 0 ) // adds to statemachine if no error
                {
                    printf("from GOTOFFER.(%s)\n",retstr);
                    return(retstr);
                } else return(clonestr("{\"error\":\"gotoffer error\"}"));
            }
            else
            {
                printf("no matching trade for %s %llu -> InstantDEX_minaccept isbob.%d\n",cmdstr,(long long)A.orderid,A.offer.myside);
                if ( instantdex_offerfind(myinfo,exchange,0,0,A.orderid,"*","*",1) == 0 )
                {
                    ap = calloc(1,sizeof(*ap));
                    *ap = A;
                    printf("acceptableQ <- %llu\n",(long long)ap->orderid);
                    queue_enqueue("acceptableQ",&exchange->acceptableQ,&ap->DL,0);
                    return(clonestr("{\"result\":\"added new order to orderbook\"}"));
                } else return(clonestr("{\"result\":\"order was already in orderbook\"}"));
            }
        }
        else if ( (swap= instantdex_statemachinefind(myinfo,exchange,A.orderid,1)) != 0 )
        {
            //printf("found existing state machine %llu\n",(long long)A.orderid);
            newjson = instantdex_parseargjson(myinfo,exchange,swap,argjson,0);
            if ( serdatalen == sizeof(swap->otherdeck) && swap->choosei < 0 && (retstr= instantdex_choosei(swap,newjson,argjson,serdata,serdatalen)) != 0 )
            {
                printf("error choosei\n");
                return(retstr);
            }
            return(instantdex_statemachine(BTC_states,BTC_numstates,myinfo,exchange,swap,cmdstr,argjson,newjson,serdata,serdatalen));
        }
        else
        {
            printf("cant find existing order.%llu that matches\n",(long long)A.orderid);
            return(clonestr("{\"error\":\"cant find matching order\"}"));
        }
    }
    return(clonestr("{\"error\":\"request needs argjson\"}"));
}

char *InstantDEX_hexmsg(struct supernet_info *myinfo,void *ptr,int32_t len,char *remoteaddr)
{
    struct instantdex_msghdr *msg = ptr; int32_t i,olen,slen,num,datalen,newlen,flag = 0;
    uint8_t *serdata; struct supernet_info *myinfos[64]; struct instantdex_offer rawoffer;
    uint64_t signerbits; uint8_t tmp[sizeof(msg->sig)]; char *retstr = 0;
    bits256 orderhash,traderpub; cJSON *retjson,*item,*argjson = 0;
    if ( BTC_states == 0 )
        BTC_states = BTC_initFSM(&BTC_numstates);
    datalen = len  - (int32_t)sizeof(msg->sig);
    serdata = (void *)((long)msg + sizeof(msg->sig));
    //printf("a signed datalen.%d allocsize.%d crc.%x\n",datalen,msg->sig.allocsize,calc_crc32(0,serdata,datalen));
    acct777_rwsig(0,(void *)&msg->sig,(void *)tmp);
    memcpy(&msg->sig,tmp,sizeof(msg->sig));
   // printf("b signed datalen.%d allocsize.%d crc.%x\n",datalen,msg->sig.allocsize,calc_crc32(0,serdata,datalen));
    if ( remoteaddr != 0 && remoteaddr[0] == 0 && strcmp("127.0.0.1",remoteaddr) == 0 && ((uint8_t *)msg)[len-1] == 0 && (argjson= cJSON_Parse((char *)msg)) != 0 )
    {
        printf("string instantdex_hexmsg RESULT.(%s)\n",jprint(argjson,0));
        free_json(argjson);
        return(clonestr("{\"error\":\"string base packets deprecated\"}"));
    }
    else if ( (signerbits= acct777_validate(&msg->sig,acct777_msgprivkey(serdata,datalen),msg->sig.pubkey)) != 0 || 1 )
    {
        flag++;
        //printf("InstantDEX_hexmsg <<<<<<<<<<<<< sigsize.%ld VALIDATED [%ld] len.%d t%u allocsize.%d (%s) [%d]\n",sizeof(msg->sig),(long)serdata-(long)msg,datalen,msg->sig.timestamp,msg->sig.allocsize,(char *)msg->serialized,serdata[datalen-1]);
        newlen = (int32_t)(msg->sig.allocsize - ((long)msg->serialized - (long)msg));
        serdata = msg->serialized;
        //printf("newlen.%d diff.%ld alloc.%d datalen.%d\n",newlen,((long)msg->serialized - (long)msg),msg->sig.allocsize,datalen);
        if ( (argjson= cJSON_Parse((char *)serdata)) != 0 )
        {
            slen = (int32_t)strlen((char *)serdata) + 1;
            serdata = &serdata[slen];
            newlen -= slen;
        }
        if ( newlen > 0 )
        {
            orderhash = instantdex_rwoffer(0,&olen,serdata,&rawoffer);
            newlen -= olen;
            //newlen -= ((long)msg->serialized - (long)msg);
            serdata = &serdata[olen];
            //printf("received orderhash.%llu olen.%d slen.%d newlen.%d\n",(long long)orderhash.txid,olen,slen,newlen);
        } else olen = 0;
        if ( newlen <= 0 )
            serdata = 0, newlen = 0;
        if ( serdata != 0 || argjson != 0 )
        {
            //printf("CALL instantdex_parse.(%s)\n",argjson!=0?jprint(argjson,0):"");
            retjson = cJSON_CreateArray();
            if ( (num= SuperNET_MYINFOS(myinfos,sizeof(myinfos)/sizeof(*myinfos))) == 0 )
            {
                myinfos[0] = myinfo;
                num = 1;
            }
            for (i=0; i<num; i++)
            {
                myinfo = myinfos[i];
                //char str[65]; printf("i.%d of %d: %s\n",i,num,bits256_str(str,myinfo->myaddr.persistent));
                traderpub = jbits256(argjson,"traderpub");
                if ( bits256_cmp(traderpub,myinfo->myaddr.persistent) == 0 )
                    continue;
                if ( (retstr= instantdex_parse(myinfo,msg,argjson,remoteaddr,signerbits,&rawoffer,orderhash,serdata,newlen)) != 0 )
                {
                    item = cJSON_CreateObject();
                    jaddstr(item,"result",retstr);
                    if ( myinfo->handle[0] != 0 )
                        jaddstr(item,"handle",myinfo->handle);
                    jaddbits256(item,"traderpub",myinfo->myaddr.persistent);
                    jaddi(retjson,item);
                }
            }
            retstr = jprint(retjson,1);
        }
    } else printf("sig err datalen.%d\n",datalen);
    if ( argjson != 0 )
        free_json(argjson);
    return(retstr);
}

char *instantdex_createaccept(struct supernet_info *myinfo,struct instantdex_accept **aptrp,struct exchange_info *exchange,char *base,char *rel,double price,double basevolume,int32_t acceptdir,char *mysidestr,int32_t duration,uint64_t offerer,int32_t queueflag,uint8_t minperc)
{
    struct instantdex_accept *ap; int32_t myside; char *retstr;
    *aptrp = 0;
    if ( exchange != 0 )
    {
        *aptrp = ap = calloc(1,sizeof(*ap));
        if ( strcmp(mysidestr,base) == 0 )
            myside = 0;
        else if ( strcmp(mysidestr,rel) == 0 )
            myside = 1;
        else
        {
            myside = -1;
            printf("myside.(%s) != base.%s or rel.%s\n",mysidestr,base,rel);
        }
        instantdex_acceptset(ap,base,rel,duration,myside,acceptdir,price,basevolume,offerer,0,minperc);
        if ( queueflag != 0 )
        {
            printf("acceptableQ <- %llu\n",(long long)ap->orderid);
            queue_enqueue("acceptableQ",&exchange->acceptableQ,&ap->DL,0);
        }
        retstr = jprint(instantdex_acceptjson(ap),1);
        //printf("acceptableQ %llu (%s)\n",(long long)ap->orderid,retstr);
        return(retstr);
    } else return(clonestr("{\"error\":\"invalid exchange\"}"));
}

void instantdex_update(struct supernet_info *myinfo)
{
    struct instantdex_msghdr *pm; struct category_msg *m; bits256 instantdexhash; char *str,remote[64]; queue_t *Q; struct queueitem *item;
    instantdexhash = calc_categoryhashes(0,"InstantDEX",0);
    //char str2[65]; printf("instantdexhash.(%s)\n",bits256_str(str2,instantdexhash));
    if ( (Q= category_Q(instantdexhash,myinfo->myaddr.persistent)) != 0 && queue_size(Q) > 0 && (item= Q->list) != 0 )
    {
        m = (void *)item;
        m = queue_dequeue(Q,0);
        pm = (struct instantdex_msghdr *)m->msg;
        //printf("loop cmd.(%s)\n",pm->cmd);
        //if ( m->remoteipbits == 0 && (m= queue_dequeue(Q,0)) )
        {
            //if ( (void *)m == (void *)item )
            {
                pm = (struct instantdex_msghdr *)m->msg;
                if ( m->remoteipbits != 0 )
                    expand_ipbits(remote,m->remoteipbits);
                else remote[0] = 0;
                if ( (str= InstantDEX_hexmsg(myinfo,pm,m->len,remote)) != 0 )
                    free(str);
            } //else printf("instantdex_update: unexpected m.%p changed item.%p\n",m,item);
            free(m);
        }
    }
}

#include "../includes/iguana_apidefs.h"

TWO_STRINGS_AND_TWO_DOUBLES(InstantDEX,maxaccept,base,rel,maxprice,basevolume)
{
    struct instantdex_accept *ap; char *retstr; struct exchange_info *exchange; uint64_t txid;
    myinfo = SuperNET_accountfind(json);
    if ( remoteaddr == 0 && (exchange= exchanges777_find("bitcoin")) != 0 )
    {
        retstr = instantdex_createaccept(myinfo,&ap,exchange,base,rel,maxprice,basevolume,-1,rel,INSTANTDEX_OFFERDURATION,myinfo->myaddr.nxt64bits,1,juint(json,"minperc"));
        return(instantdex_checkoffer(myinfo,&txid,exchange,ap,json));

    } else return(clonestr("{\"error\":\"InstantDEX API request only local usage!\"}"));
}

TWO_STRINGS_AND_TWO_DOUBLES(InstantDEX,minaccept,base,rel,minprice,basevolume)
{
    struct instantdex_accept *ap; char *retstr; struct exchange_info *exchange; uint64_t txid;
    myinfo = SuperNET_accountfind(json);
    if ( remoteaddr == 0 && (exchange= exchanges777_find("bitcoin")) != 0 )
    {
        retstr = instantdex_createaccept(myinfo,&ap,exchanges777_find("bitcoin"),base,rel,minprice,basevolume,1,base,INSTANTDEX_OFFERDURATION,myinfo->myaddr.nxt64bits,1,juint(json,"minperc"));
        return(instantdex_checkoffer(myinfo,&txid,exchange,ap,json));
    } else return(clonestr("{\"error\":\"InstantDEX API request only local usage!\"}"));
}

char *instantdex_statemachineget(struct supernet_info *myinfo,struct bitcoin_swapinfo **swapp,cJSON *argjson,char *remoteaddr)
{
    struct bitcoin_swapinfo *swap; uint64_t orderid,otherorderid; struct exchange_info *exchange;
    *swapp = 0;
    if ( remoteaddr == 0 && (exchange= exchanges777_find("bitcoin")) != 0 )
    {
        orderid = j64bits(argjson,"myorderid");
        otherorderid = j64bits(argjson,"otherid");
        if ( (swap= instantdex_statemachinefind(myinfo,exchange,orderid,1)) != 0 )
        {
            if ( swap->other.orderid != otherorderid )
                return(clonestr("{\"error\":\"statemachine otherid mismatch\"}"));
            else
            {
                *swapp = swap;
                return(0);
            }
        } else return(clonestr("{\"error\":\"statemachine not found\"}"));
    } else return(clonestr("{\"error\":\"atomic API request only local usage!\"}"));
}

THREE_STRINGS(atomic,approve,myorderid,otherid,txname)
{
    char *retstr,virtualevent[16]; cJSON *newjson; struct bitcoin_statetx *tx; struct bitcoin_swapinfo *swap = 0;
    if ( (retstr= instantdex_statemachineget(myinfo,&swap,json,remoteaddr)) != 0 )
        return(retstr);
    else if ( (tx= instantdex_getstatetx(swap,txname)) == 0 )
        return(clonestr("{\"error\":\"cant find txname\"}"));
    else
    {
        strcpy(virtualevent,txname);
        strcat(virtualevent,"found");
        newjson = cJSON_CreateObject();
        if ( (retstr= instantdex_sendcmd(myinfo,&swap->mine.offer,newjson,virtualevent,myinfo->myaddr.persistent,0,0,0)) != 0 )
            return(retstr);
        else return(clonestr("{\"result\":\"statemachine sent found event\"}"));
    }
}

THREE_STRINGS(atomic,claim,myorderid,otherid,txname)
{
    char *retstr; struct bitcoin_statetx *tx; struct bitcoin_swapinfo *swap = 0;
    if ( (retstr= instantdex_statemachineget(myinfo,&swap,json,remoteaddr)) != 0 )
        return(retstr);
    else if ( (tx= instantdex_getstatetx(swap,txname)) == 0 )
        return(clonestr("{\"error\":\"cant find txname\"}"));
    else
    {
        return(clonestr("{\"result\":\"statemachine should claim tx\"}"));
    }
}

THREE_STRINGS_AND_DOUBLE(tradebot,aveprice,comment,base,rel,basevolume)
{
    double retvals[4],aveprice; cJSON *retjson = cJSON_CreateObject();
    aveprice = instantdex_avehbla(myinfo,retvals,base,rel,basevolume);
    jaddstr(retjson,"result","success");
    jaddnum(retjson,"aveprice",aveprice);
    jaddnum(retjson,"avebid",retvals[0]);
    jaddnum(retjson,"bidvol",retvals[1]);
    jaddnum(retjson,"aveask",retvals[2]);
    jaddnum(retjson,"askvol",retvals[3]);
    return(jprint(retjson,1));
}

#include "../includes/iguana_apiundefs.h"

