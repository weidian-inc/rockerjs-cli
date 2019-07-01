"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isProduction() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv) {
        return serverEnv !== 'local' && serverEnv !== 'unittest';
    }
    return serverEnv === 'production' || serverEnv === 'prod';
}
exports.isProduction = isProduction;
function isDev() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv == 'local' || serverEnv == 'dev' || !serverEnv) {
        return true;
    }
    else {
        return false;
    }
}
exports.isDev = isDev;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLFNBQWdCLFlBQVk7SUFDeEIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBSSxTQUFTLEVBQUU7UUFDWCxPQUFPLFNBQVMsS0FBSyxPQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsQ0FBQztLQUM1RDtJQUNELE9BQU8sU0FBUyxLQUFLLFlBQVksSUFBSSxTQUFTLEtBQUssTUFBTSxDQUFDO0FBQzlELENBQUM7QUFORCxvQ0FNQztBQUVELFNBQWdCLEtBQUs7SUFDakIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBRyxTQUFTLElBQUksT0FBTyxJQUFJLFNBQVMsSUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUM7UUFDeEQsT0FBTyxJQUFJLENBQUM7S0FDZjtTQUFJO1FBQ0QsT0FBTyxLQUFLLENBQUE7S0FDZjtBQUNMLENBQUM7QUFQRCxzQkFPQyJ9