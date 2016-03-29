//根据VM的属性值或表达式的值切换类名，ms-class='xxx yyy zzz:flag'
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
var markID = require('../seed/lang.share').getLongID

var directives = avalon.directives
avalon.directive('class', {
    parse: function (binding, num) {
        //必须是布尔对象或字符串数组
        return 'vnode' + num + '.props["' + binding.name + '"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, type) {
        var curValue = cur.props['ms-' + type]
        var preValue = pre.props['ms-' + type]
        if (!pre.classEvent) {
            var classEvent = {}
            if (type === 'hover') {//在移出移入时切换类名
                classEvent.mouseenter = activateClass
                classEvent.mouseleave = abandonClass
            } else if (type === 'active') {//在获得焦点时切换类名
                cur.props.tabindex = cur.props.tabindex || -1
                classEvent.tabIndex = cur.props.tabindex
                classEvent.mousedown = activateClass
                classEvent.mouseup = abandonClass
                classEvent.mouseleave = abandonClass
            }
            cur.classEvent = classEvent
        } else {
            cur.classEvent = pre.classEvent
        }
        pre.classEvent = null

        var className
        if (Array.isArray(curValue)) {
            //convert it to a string 
            className = curValue.join(' ').trim().replace(/\s+/, ' ')
        } else if (typeof curValue === 'object') {
            className = Object.keys(curValue).filter(function (name) {
                return curValue[name]
            }).join(' ')
        } else if (typeof curValue === 'string') {
            className = curValue.trim().replace(/\s+/, ' ')
        } 
        
        if (typeof className !== 'string') {
            cur.props['ms-' + type] = preValue
            
            return
        }
        if (!preValue || preValue !== className) {
            cur['change-' + type] = className
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }

    },
    
    update: function (node, vnode) {
        var classEvent = vnode.classEvent
        if (classEvent) {
            for (var i in classEvent) {
                if (i === 'tabIndex') {
                    node[i] = classEvent[i]
                } else {
                    avalon.bind(node, i, classEvent[i])
                }
            }
            vnode.classEvent = {}
        }
        var names = ['class', 'hover', 'active']
        names.forEach(function (type) {
            var name = 'change-' + type
            var value = vnode[ name ]
            if (!value)
                return
            if (type === 'class') {

                setClass(node, vnode)
            } else {
                var oldType = node.getAttribute(name)
                if (oldType) {
                    avalon(node).removeClass(oldType)
                }
                node.setAttribute(name, value)
            }
        })
    }
})
directives.active = directives.hover = directives['class']

var classMap = {
    mouseenter: 'change-hover',
    mouseleave: 'change-hover',
    mousedown: 'change-active',
    mouseup: 'change-active'
}

function activateClass(e) {
    var elem = e.target
    avalon(elem).addClass(elem.getAttribute(classMap[e.type]) || '')
}

function abandonClass(e) {
    var elem = e.target
    var name = classMap[e.type]
    avalon(elem).removeClass(elem.getAttribute(name) || '')
    if (name !== 'change-active') {
        avalon(elem).removeClass(elem.getAttribute('change-active') || '')
    }
}

function setClass(node, vnode) {
    var old = node.getAttribute('old-change-class')||''
    var neo = vnode['change-class']
    avalon(node).removeClass(old).addClass(neo)
    node.setAttribute('old-change-class', neo)
    delete vnode['change-class']
}

markID(activateClass)
markID(abandonClass)


